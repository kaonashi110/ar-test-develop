// ============================================
// ローディングアニメーション
// ============================================
class LoadingAnimationManager {
    constructor() {
        this.overlay = null;
        this.elements = {};
        this.animationTimer = null;
        this.hasError = false; // エラーフラグ
    }

    // ローディング画面の作成
    create() {
        this.overlay = document.createElement('div');
        this.overlay.id = 'loading-overlay';
        this.overlay.innerHTML = `
            <div id="loading-text">ARアプリを起動中...</div>
            
            <div id="loading-circle-container">
                <div id="loading-circle-fill"></div>
                <div id="loading-percentage">0%</div>
            </div>
            
            <div id="loading-text-animation">
                <span class="loading-char">L</span>
                <span class="loading-char">O</span>
                <span class="loading-char">A</span>
                <span class="loading-char">D</span>
                <span class="loading-char">I</span>
                <span class="loading-char">N</span>
                <span class="loading-char">G</span>
                <span class="loading-char">.</span>
                <span class="loading-char">.</span>
                <span class="loading-char">.</span>
            </div>

            <div id="loading-detail">初期化しています...</div>

            <!-- <div id="debug-info"></div>  デバッグ用-->
            <div id="error-message"></div>
        `;
        
        document.body.appendChild(this.overlay);
        
        // 要素の参照を保存
        this.elements = {
            text: document.getElementById('loading-text'),
            detail: document.getElementById('loading-detail'),
            percentage: document.getElementById('loading-percentage'),
            fill: document.getElementById('loading-circle-fill'),
            // debugInfo: document.getElementById('debug-info'), デバッグ用
            errorMessage: document.getElementById('error-message')
        };
    }

    // ステータステキストの更新
    updateStatus(text) {
        if (this.elements.text) {
            this.elements.text.textContent = text;
        }
    }

    // 詳細テキストの更新
    updateDetail(text) {
        if (this.elements.detail) {
            this.elements.detail.textContent = text;
        }
    }

    // プログレスバーの更新
    updateProgress(percentage) {
        if (this.hasError) return; // エラー時は処理しない

        if (this.elements.fill) {
            this.elements.fill.style.height = `${percentage}%`;
        }
        this.animatePercentage(percentage);
    }

    // パーセンテージのアニメーション（テキスト）
    animatePercentage(target) {
        if (this.hasError || !this.elements.percentage) return; // エラー時は処理しない

        let current = parseInt(this.elements.percentage.textContent.replace('%', '')) || 0;
        const duration = 600;
        const steps = 20;
        const stepTime = duration / steps;
        const increment = (target - current) / steps;
        let count = 0;

        // 既存のアニメーションをクリア
        if (this.animationTimer) {
            clearInterval(this.animationTimer);
        }

        this.animationTimer = setInterval(() => {
            current += increment;
            count++;

            if (count >= steps) {
                current = target;
                clearInterval(this.animationTimer);
                this.animationTimer = null;
            }

            this.elements.percentage.textContent = `${Math.round(current)}%`;
        }, stepTime);
    }

    // ローディング画面を非表示
    hide() {
        if (this.hasError) {
            return;
        }
        if (this.overlay) {
            this.overlay.style.transition = 'opacity 1s ease-out';
            this.overlay.style.opacity = '0';
            setTimeout(() => {
                this.overlay.classList.add('hidden');
                if (this.animationTimer) {
                    clearInterval(this.animationTimer);
                }
            }, 1000);
        }
    }

    // エラー表示用のメソッド（ErrorHandlerから呼ばれる）
    showErrorMessage(html) {
        if (this.elements.errorMessage) {
            this.hasError = true; // エラーフラグを立てる

            // アニメーション停止
            if (this.animationTimer) {
                clearInterval(this.animationTimer);
                this.animationTimer = null;
            }

            // LOADINGアニメーションの文字をERRORに差し替え
            const animationEl = document.getElementById('loading-text-animation');
            if (animationEl) {
                animationEl.innerHTML = `<span class="error-text">ERROR</span>`;
            }
            
            this.elements.errorMessage.innerHTML = html;
            this.elements.errorMessage.style.display = 'block';
        }
    }
}

// ============================================
// デバッグログ
// ============================================
class DebugLogger {
    constructor() {
        this.logs = [];
    }

    // ログを記録
    log(message, level = 'info') {

        const logEntry = {
            level: level,
            message: message,
        };
        
        this.logs.push(logEntry);
    }

    // エラーログ
    error(message) {
        this.log(message, 'error');
    }

    // 警告ログ
    warn(message) {
        this.log(message, 'warn');
    }

    // 情報ログ
    info(message) {
        this.log(message, 'info');
    }
}

// ============================================
// エラーハンドリング
// ============================================
class ErrorHandler {
    constructor(displayManager = null, logger = null) {
        this.displayManager = displayManager;
        this.logger = logger;
        this.errorCallbacks = {};
    }

    // エラータイプごとのコールバックを登録
    on(errorType, callback) {
        if (!this.errorCallbacks[errorType]) {
            this.errorCallbacks[errorType] = [];
        }
        this.errorCallbacks[errorType].push(callback);
    }

    // ビデオエラー
    handleVideoError(error) {
        let errorInfo = {
            type: 'video',
            code: error ? error.code : null,
            message: '動画の読み込みでエラーが発生しました。',
            details: null,
            recoverable: true
        };

        if (error) {
            switch(error.code) {
                case 1: // MEDIA_ERR_ABORTED
                    errorInfo.message = '動画の読み込みが中断されました。';
                    errorInfo.details = 'ユーザーによって中断された可能性があります。';
                    break;
                case 2: // MEDIA_ERR_NETWORK
                    errorInfo.message = 'ネットワークエラーで動画を読み込めませんでした。';
                    errorInfo.details = 'インターネット接続を確認してください。';
                    break;
                case 3: // MEDIA_ERR_DECODE
                    errorInfo.message = '動画ファイルが破損している可能性があります。';
                    errorInfo.details = 'ファイルの再アップロードが必要かもしれません。';
                    errorInfo.recoverable = false;
                    break;
                case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
                    errorInfo.message = '動画形式がサポートされていません。';
                    errorInfo.details = 'MP4形式を使用してください。';
                    errorInfo.recoverable = false;
                    break;
            }
        }

        this.logError(errorInfo);
        this.displayError(errorInfo);
        this.executeCallbacks('video', errorInfo);
        
        return errorInfo;
    }

    // カメラエラー
    handleCameraError(error) {
        let errorInfo = {
            type: 'camera',
            name: error.name,
            message: 'カメラアクセスエラー',
            details: error.message,
            recoverable: true
        };

        switch(error.name) {
            case 'NotAllowedError':
                errorInfo.message = 'カメラアクセスが拒否されました。';
                errorInfo.details = 'ブラウザの設定でカメラへのアクセスを許可してください。';
                errorInfo.recoverable = false;
                break;
            case 'NotFoundError':
                errorInfo.message = 'カメラが見つかりません。';
                errorInfo.details = 'デバイスにカメラが接続されているか確認してください。';
                errorInfo.recoverable = false;
                break;
            case 'NotReadableError':
                errorInfo.message = 'カメラが使用中です。';
                errorInfo.details = '他のアプリケーションがカメラを使用している可能性があります。';
                break;
            case 'OverconstrainedError':
                errorInfo.message = 'カメラの設定に問題があります。';
                errorInfo.details = '要求された設定がデバイスでサポートされていません。';
                break;
        }

        this.logError(errorInfo);
        this.displayError(errorInfo);
        this.executeCallbacks('camera', errorInfo);
        
        return errorInfo;
    }

    // ネットワークエラー
    handleNetworkError(url, statusCode) {
        const errorInfo = {
            type: 'network',
            url: url,
            statusCode: statusCode,
            message: 'ファイルの読み込みに失敗しました。',
            details: `URL: ${url}, ステータス: ${statusCode}`,
            recoverable: statusCode >= 500 // サーバーエラーは再試行可能
        };

        if (statusCode === 404) {
            errorInfo.message = 'ファイルが見つかりません。';
            errorInfo.details = 'ファイルのパスを確認してください。';
            errorInfo.recoverable = false;
        } else if (statusCode >= 500) {
            errorInfo.message = 'サーバーエラーが発生しました。';
            errorInfo.details = 'しばらく待ってから再試行してください。';
        }

        this.logError(errorInfo);
        this.displayError(errorInfo);
        this.executeCallbacks('network', errorInfo);
        
        return errorInfo;
    }

    // タイムアウトエラー
    handleTimeout(operation, duration) {
        const errorInfo = {
            type: 'timeout',
            operation: operation,
            duration: duration,
            message: `${operation}がタイムアウトしました。`,
            details: `${duration}秒経過しても完了しませんでした。`,
            recoverable: true
        };

        this.logError(errorInfo);
        this.displayError(errorInfo);
        this.executeCallbacks('timeout', errorInfo);
        
        return errorInfo;
    }

    // エラーをログに記録
    logError(errorInfo) {
        if (this.logger) {
            this.logger.error(`${errorInfo.type.toUpperCase()}: ${errorInfo.message} - ${errorInfo.details || ''}`);
        }
    }

    // エラーを画面に表示
    displayError(errorInfo) {
        if (!this.displayManager) return;

        let html = `
            <div class="error-container">
                <h3>⚠️ ${errorInfo.message}</h3>
        `;

        if (errorInfo.details) {
            html += `<p>${errorInfo.details}</p>`;
        }

        if (errorInfo.recoverable) {
            html += `
                <button onclick="retryOperation('${errorInfo.type}')" 
                        style="background: #4CAF50; color: white; border: none; 
                               padding: 10px 20px; border-radius: 4px; cursor: pointer; margin: 5px;">
                    再試行
                </button>
            `;
        }

        html += `
                <button onclick="window.location.reload()" 
                        style="background: #f44336; color: white; border: none; 
                               padding: 10px 20px; border-radius: 4px; cursor: pointer; margin: 5px;">
                    ページを再読み込み
                </button>
            </div>
        `;

        this.displayManager.showErrorMessage(html);
    }

    // エラータイプごとのコールバックを実行
    executeCallbacks(errorType, errorInfo) {
        if (this.errorCallbacks[errorType]) {
            this.errorCallbacks[errorType].forEach(callback => {
                try {
                    callback(errorInfo);
                } catch (e) {
                    console.error('Error callback failed:', e);
                }
            });
        }
    }
}

// ============================================
// ARローディング管理
// ============================================
class ARLoadingManager {
    constructor() {
        // 各専門クラスのインスタンスを作成
        this.animationManager = new LoadingAnimationManager();
        this.logger = new DebugLogger(this.animationManager);
        this.errorHandler = new ErrorHandler(this.animationManager, this.logger);
        
        // 内部状態
        this.videoElement = null;
        this.videoTimeout = null;
        
        // タイムアウトの時間設定
        this.VIDEO_TIMEOUT = 15;
        
        // エラーハンドリングのコールバック設定
        this.setupErrorCallbacks();
    }

    // 初期化
    init() {
        this.animationManager.create();
        this.logger.log('ARLoadingManager初期化開始');
        this.startLoadingSequence();
        this.setupTimeouts();
    }

    // エラーコールバックの設定
    setupErrorCallbacks() {
        // ビデオエラー時の処理
        this.errorHandler.on('video', (errorInfo) => {
            if (!errorInfo.recoverable) {
                this.logger.warn('ビデオの読み込みに失敗しました')
            }
        });

        // カメラエラー時の処理
        this.errorHandler.on('camera', (errorInfo) => {
            if (!errorInfo.recoverable) {
                this.logger.warn('カメラの読み込みに失敗しました');
            }
        });

        // タイムアウト時の処理
        this.errorHandler.on('timeout', (errorInfo) => {
            if (errorInfo.operation === 'video') {
                this.showVideoTimeoutWarning();
            }
        });
    }

    // ライブラリの読み込み確認
    startLoadingSequence() {
        this.logger.log('ライブラリ読み込み確認中...');
        this.animationManager.updateProgress(20);
        
        const checkLibraries = () => {
            if (typeof AFRAME !== 'undefined') {
                this.logger.log('A-Frame読み込み完了');
                this.animationManager.updateProgress(40);
                this.requestCameraAccess();
            } else {
                this.logger.log('A-Frame読み込み待機中...');
                setTimeout(checkLibraries, 100);
            }
        };
        checkLibraries();
    }

    // カメラアクセス要求
    requestCameraAccess() {
        this.logger.log('カメラアクセス要求中...');
        this.animationManager.updateStatus('カメラアクセスを要求中...');
        
        navigator.mediaDevices.getUserMedia({ video: true })
            .then((stream) => {
                if (!stream || !stream.getVideoTracks().length) {
                    this.errorHandler.handleCameraError(error);
                }
                this.logger.log('カメラアクセス許可取得');
                this.animationManager.updateProgress(60);
                this.initializeAR();
            })
            .catch((error) => {
                this.errorHandler.handleCameraError(error);
            });
    }

    // AR初期化
    initializeAR() {
        this.logger.log('AR初期化開始...');
        this.animationManager.updateStatus('AR機能を初期化中...');
        
        const scene = document.querySelector('a-scene');
        if (scene) {
            this.logger.log('A-Frameシーン要素発見');
            
            scene.addEventListener('loaded', () => {
                this.logger.log('A-Frameシーン読み込み完了');
                this.animationManager.updateProgress(80);
                this.setupVideo();
            });

            if (scene.hasLoaded) {
                this.logger.log('A-Frameシーン既に読み込み済み');
                this.animationManager.updateProgress(80);
                this.setupVideo();
            }
        } else {
            this.logger.warn('A-Frameシーン要素が見つかりません - 再試行');
            setTimeout(() => this.initializeAR(), 500);
        }
    }

    // ビデオセットアップ
    setupVideo() {
        this.logger.log('動画セットアップ開始...');
        this.animationManager.updateStatus('動画を読み込み中...');
        
        this.videoElement = document.querySelector('#myvideo');
        if (!this.videoElement) {
            this.logger.error('動画要素が見つかりません');
            this.errorHandler.handleVideoError({ code: 0, message: '動画要素が見つかりません' });
            return;
        }

        const videoSrc = this.videoElement.src || this.videoElement.getAttribute('src');
        this.logger.log(`動画ソース: ${videoSrc}`);

        this.checkVideoFile(videoSrc);
        this.setupVideoEvents();
        this.videoElement.load();
    }

    // ビデオファイルの確認
    async checkVideoFile(src) {
        try {
            this.logger.log(`動画ファイル存在確認: ${src}`);
            const response = await fetch(src, { method: 'HEAD' });
            
            if (response.ok) {
                this.logger.log(`動画ファイル確認OK: ${response.status}`);
                this.logger.log(`Content-Type: ${response.headers.get('content-type')}`);
                this.logger.log(`Content-Length: ${response.headers.get('content-length')} bytes`);
            } else {
                this.errorHandler.handleNetworkError(src, response.status);
            }
        } catch (error) {
            this.logger.error(`動画ファイル確認エラー: ${error.message}`);
            this.errorHandler.handleNetworkError(src, 0);
        }
    }

    // ビデオイベントの設定
    setupVideoEvents() {
        const video = this.videoElement;
        
        video.addEventListener('loadstart', () => {
            this.logger.log('動画: loadstart - 読み込み開始');
            this.animationManager.updateDetail('動画データを取得中...');
        });

        video.addEventListener('loadedmetadata', () => {
            this.logger.log(`動画メタデータ: ${video.videoWidth}x${video.videoHeight}, ${video.duration}秒`);
            this.animationManager.updateDetail('動画情報を取得しました');
        });

        video.addEventListener('canplay', () => {
            this.logger.log('動画: canplay - 再生可能');
            this.clearTimeouts();
            this.animationManager.updateProgress(100);
            this.animationManager.updateStatus('AR準備完了！');
            setTimeout(() => this.complete(), 1000);
        });

        video.addEventListener('error', (e) => {
            this.errorHandler.handleVideoError(video.error);
        });

        video.addEventListener('progress', () => {
            if (video.buffered.length > 0 && video.duration > 0) {
                const progress = (video.buffered.end(0) / video.duration) * 100;
                this.logger.log(`動画バッファ: ${progress.toFixed(1)}%`);
                this.animationManager.updateDetail(`動画読み込み: ${Math.round(progress)}%`);
            }
        });
    }

    // タイムアウト設定
    setupTimeouts() {
        this.videoTimeout = setTimeout(() => {
            this.errorHandler.handleTimeout('video', this.VIDEO_TIMEOUT);
        }, this.VIDEO_TIMEOUT * 1000);
    }

    // タイムアウトのクリア
    clearTimeouts() {
        if (this.videoTimeout) {
            clearTimeout(this.videoTimeout);
            this.videoTimeout = null;
        }
    }

    // ビデオタイムアウト警告
    showVideoTimeoutWarning() {
        this.animationManager.updateDetail('動画の読み込みに時間がかかっています');
        this.logger.warn('動画読み込みが遅延しています');
    }

    // 完了処理
    complete() {
        this.logger.log('ARローディング完了');
        this.clearTimeouts();
        this.animationManager.hide();
    }
}

// ============================================
// グローバル関数（HTMLから呼び出し）
// ============================================
let arManager;

// 再試行操作
function retryOperation(operationType) {
    if (arManager) {
        switch(operationType) {
            case 'video':
                arManager.setupVideo();
                break;
            case 'camera':
                arManager.requestCameraAccess();
                break;
            default:
                window.location.reload();
        }
    }
}

// ============================================
// A-Frame コンポーネント
// ============================================
AFRAME.registerComponent("play-video", {
    schema: {
        video: { type: "string" },
        canstop: { type: "bool" },
    },
    init: function () {
        this.v = document.querySelector(this.data.video);
        
        if (!this.v) {
            console.warn('動画要素が見つかりません');
            return;
        }

        this.el.setAttribute("class", "cantap");
        
        // 動画がある場合のみマテリアル設定
        if (this.v.src) {
            this.el.setAttribute("material", {
                src: this.v,
                shader: "chromakey",
                side: "double",
            });
        } else {
            // 動画がない場合は代替表示
            this.el.setAttribute("material", {
                color: "#4CAF50",
                side: "double",
            });
        }

        this.playing = false;
        this.playstart = this.playstart.bind(this);

        window.addEventListener("markerFound", (event) => {
            this.playstart();
        });
        this.el.addEventListener("click", this.playstart);
    },

    playstart: function () {
        if (!this.v || !this.v.src) {
            console.log('動画が設定されていません');
            return;
        }

        if (!this.playing) {
            if (this.v.readyState >= 2) {
                this.v.play().catch(error => {
                    console.error('動画再生エラー:', error);
                });
                this.playing = true;
            } else {
                console.warn('動画がまだ準備できていません');
            }
        } else if (this.data.canstop) {
            this.v.pause();
            this.playing = false;
        }
    },
});

// ============================================
// 初期化
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    arManager = new ARLoadingManager();
    arManager.init();
});
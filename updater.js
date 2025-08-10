// Game Updater for Dave Game
// GitHub Repository: https://github.com/snirsnir/dave

class GameUpdater {
    constructor() {
        this.repoOwner = 'snirsnir';
        this.repoName = 'dave';
        this.apiBase = `https://api.github.com/repos/${this.repoOwner}/${this.repoName}`;
        this.rawBase = `https://raw.githubusercontent.com/${this.repoOwner}/${this.repoName}/main`;
        this.versionFile = 'version.json';
        this.currentVersion = null;
        this.isElectron = typeof window !== 'undefined' && window.require;
        
        // Files to exclude from updates (Electron specific files)
        this.excludeFiles = [
            'main.js',
            'package.json',
            'package-lock.json',
            'updater.js',
            'version.json',
            'node_modules',
            '.git',
            'README.md',
            'LICENSE'
        ];
        
        this.init();
    }
    
    async init() {
        await this.loadCurrentVersion();
        this.createUpdateUI();
    }
    
    // טען את הגרסה הנוכחית מהקובץ המקומי
    async loadCurrentVersion() {
        try {
            if (this.isElectron) {
                const fs = window.require('fs').promises;
                const path = window.require('path');
                const versionPath = path.join(process.cwd(), this.versionFile);
                
                if (await this.fileExists(versionPath)) {
                    const data = await fs.readFile(versionPath, 'utf8');
                    this.currentVersion = JSON.parse(data);
                } else {
                    // אין קובץ גרסה - צור ברירת מחדל
                    this.currentVersion = {
                        commit: null,
                        lastUpdate: null,
                        version: "1.0.0"
                    };
                    await this.saveCurrentVersion();
                }
            } else {
                // Browser mode - use localStorage
                const versionData = localStorage.getItem('gameVersion');
                if (versionData) {
                    this.currentVersion = JSON.parse(versionData);
                } else {
                    this.currentVersion = {
                        commit: null,
                        lastUpdate: null,
                        version: "1.0.0"
                    };
                    this.saveCurrentVersion();
                }
            }
        } catch (error) {
            console.error('Error loading current version:', error);
            this.currentVersion = {
                commit: null,
                lastUpdate: null,
                version: "1.0.0"
            };
        }
    }
    
    // שמור את הגרסה הנוכחית
    async saveCurrentVersion() {
        try {
            const versionData = JSON.stringify(this.currentVersion, null, 2);
            
            if (this.isElectron) {
                const fs = window.require('fs').promises;
                const path = window.require('path');
                const versionPath = path.join(process.cwd(), this.versionFile);
                await fs.writeFile(versionPath, versionData, 'utf8');
            } else {
                localStorage.setItem('gameVersion', versionData);
            }
        } catch (error) {
            console.error('Error saving version:', error);
        }
    }
    
    // בדוק אם קובץ קיים
    async fileExists(filePath) {
        if (!this.isElectron) return false;
        
        try {
            const fs = window.require('fs').promises;
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }
    
    // יצירת ממשק המשתמש לעדכונים
    createUpdateUI() {
        // יצירת modal לעדכונים
        const modal = document.createElement('div');
        modal.id = 'updateModal';
        modal.className = 'update-modal';
        modal.innerHTML = `
            <div class="update-modal-content">
                <div class="update-header">
                    <h3>בדיקת עדכונים</h3>
                    <button class="update-close-btn">×</button>
                </div>
                <div class="update-body">
                    <div class="update-status">מתחיל בדיקה...</div>
                    <div class="update-progress-container" style="display: none;">
                        <div class="update-progress-bar">
                            <div class="update-progress-fill"></div>
                        </div>
                        <div class="update-progress-text">0%</div>
                    </div>
                    <div class="update-log"></div>
                </div>
                <div class="update-footer">
                    <button class="update-start-btn" style="display: none;">התחל עדכון</button>
                    <button class="update-cancel-btn">ביטול</button>
                </div>
            </div>
        `;
        
        // הוספת סגנונות
        const style = document.createElement('style');
        style.textContent = `
            .update-modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.9);
                z-index: 10000;
                justify-content: center;
                align-items: center;
            }
            
            .update-modal-content {
                background-color: #000;
                max-width: 600px;
                width: 90%;
                max-height: 80vh;
                border: 4px solid #0088ff;
                border-radius: 15px;
                box-shadow: 
                    0 0 10px #0088ff,
                    0 0 20px #0088ff,
                    inset 0 0 10px rgba(0, 136, 255, 0.3);
                color: #fff;
                font-family: 'Noto Sans Hebrew', sans-serif;
                overflow: hidden;
            }
            
            .update-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px;
                border-bottom: 2px solid #0088ff;
                background-color: rgba(0, 136, 255, 0.1);
            }
            
            .update-header h3 {
                margin: 0;
                font-size: 24px;
                color: #0088ff;
                text-shadow: 0 0 10px #0088ff;
            }
            
            .update-close-btn {
                background: none;
                border: none;
                color: #fff;
                font-size: 30px;
                cursor: pointer;
                padding: 0;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                transition: all 0.3s ease;
            }
            
            .update-close-btn:hover {
                background-color: rgba(255, 0, 0, 0.3);
                color: #ff0000;
            }
            
            .update-body {
                padding: 20px;
                max-height: 400px;
                overflow-y: auto;
            }
            
            .update-status {
                font-size: 18px;
                margin-bottom: 15px;
                color: #00ff00;
                text-align: center;
            }
            
            .update-progress-container {
                margin: 20px 0;
            }
            
            .update-progress-bar {
                width: 100%;
                height: 20px;
                background-color: #333;
                border-radius: 10px;
                border: 2px solid #0088ff;
                overflow: hidden;
                position: relative;
            }
            
            .update-progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #00ff00, #0088ff);
                width: 0%;
                transition: width 0.3s ease;
                border-radius: 8px;
                box-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
            }
            
            .update-progress-text {
                text-align: center;
                margin-top: 10px;
                font-size: 16px;
                color: #00ff00;
            }
            
            .update-log {
                background-color: rgba(0, 0, 0, 0.5);
                border: 1px solid #333;
                border-radius: 5px;
                padding: 10px;
                font-family: monospace;
                font-size: 14px;
                max-height: 200px;
                overflow-y: auto;
                color: #00ff00;
            }
            
            .update-footer {
                padding: 15px 20px;
                border-top: 2px solid #0088ff;
                background-color: rgba(0, 136, 255, 0.1);
                display: flex;
                justify-content: flex-end;
                gap: 10px;
            }
            
            .update-start-btn, .update-cancel-btn {
                padding: 10px 20px;
                border: none;
                border-radius: 5px;
                font-size: 16px;
                cursor: pointer;
                font-family: 'Noto Sans Hebrew', sans-serif;
                transition: all 0.3s ease;
            }
            
            .update-start-btn {
                background-color: #00ff00;
                color: #000;
                box-shadow: 0 0 10px #00ff00;
            }
            
            .update-start-btn:hover {
                background-color: #00cc00;
                transform: scale(1.05);
            }
            
            .update-cancel-btn {
                background-color: #ff0000;
                color: #fff;
                box-shadow: 0 0 10px #ff0000;
            }
            
            .update-cancel-btn:hover {
                background-color: #cc0000;
                transform: scale(1.05);
            }
            
            .check-updates-btn {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background-color: #0088ff;
                color: white;
                border: none;
                padding: 15px 25px;
                font-size: 16px;
                font-family: 'Noto Sans Hebrew', sans-serif;
                cursor: pointer;
                border-radius: 8px;
                box-shadow: 
                    0 0 10px #0088ff,
                    0 0 20px rgba(0, 136, 255, 0.5);
                z-index: 1000;
                transition: all 0.3s ease;
            }
            
            .check-updates-btn:hover {
                background-color: #0066cc;
                transform: scale(1.05);
                box-shadow: 
                    0 0 15px #0088ff,
                    0 0 30px rgba(0, 136, 255, 0.7);
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(modal);
        
        // הוספת event listeners
        modal.querySelector('.update-close-btn').onclick = () => this.hideUpdateModal();
        modal.querySelector('.update-cancel-btn').onclick = () => this.hideUpdateModal();
        modal.querySelector('.update-start-btn').onclick = () => this.startUpdate();
    }
    
    // הוספת כפתור בדיקת עדכונים לדף
    addCheckUpdatesButton() {
        const button = document.createElement('button');
        button.className = 'check-updates-btn';
        button.textContent = 'בדוק לעדכונים';
        button.onclick = () => this.checkForUpdates();
        document.body.appendChild(button);
    }
    
    // הצגת modal העדכונים
    showUpdateModal() {
        document.getElementById('updateModal').style.display = 'flex';
    }
    
    // הסתרת modal העדכונים
    hideUpdateModal() {
        document.getElementById('updateModal').style.display = 'none';
    }
    
    // עדכון הסטטוס במודל
    updateStatus(message) {
        const status = document.querySelector('.update-status');
        if (status) status.textContent = message;
    }
    
    // הוספת הודעה ללוג
    addToLog(message) {
        const log = document.querySelector('.update-log');
        if (log) {
            const time = new Date().toLocaleTimeString('he-IL');
            log.innerHTML += `<div>[${time}] ${message}</div>`;
            log.scrollTop = log.scrollHeight;
        }
    }
    
    // עדכון בר ההתקדמות
    updateProgress(percentage) {
        const fill = document.querySelector('.update-progress-fill');
        const text = document.querySelector('.update-progress-text');
        const container = document.querySelector('.update-progress-container');
        
        if (fill && text && container) {
            container.style.display = 'block';
            fill.style.width = percentage + '%';
            text.textContent = Math.round(percentage) + '%';
        }
    }
    
    // בדיקת עדכונים זמינים
    async checkForUpdates() {
        this.showUpdateModal();
        this.updateStatus('בודק עדכונים...');
        this.addToLog('מתחיל בדיקת עדכונים');
        
        try {
            // קבלת הקומיט האחרון
            const response = await fetch(`${this.apiBase}/commits/main`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const latestCommit = await response.json();
            const latestSha = latestCommit.sha;
            
            this.addToLog(`קומיט אחרון: ${latestSha.substring(0, 8)}`);
            this.addToLog(`קומיט נוכחי: ${this.currentVersion.commit ? this.currentVersion.commit.substring(0, 8) : 'לא קיים'}`);
            
            if (this.currentVersion.commit === latestSha) {
                this.updateStatus('המשחק מעודכן לגרסה האחרונה! 🎉');
                this.addToLog('אין עדכונים זמינים');
                return;
            }
            
            // יש עדכון זמין
            this.latestCommit = latestCommit;
            this.updateStatus('עדכון זמין! לחץ "התחל עדכון" כדי להמשיך');
            this.addToLog('נמצא עדכון זמין');
            document.querySelector('.update-start-btn').style.display = 'inline-block';
            
        } catch (error) {
            console.error('Error checking for updates:', error);
            this.updateStatus('שגיאה בבדיקת עדכונים: ' + error.message);
            this.addToLog('שגיאה: ' + error.message);
        }
    }
    
    // התחלת תהליך העדכון
    async startUpdate() {
        if (!this.latestCommit) {
            this.addToLog('שגיאה: לא נמצא עדכון להתקנה');
            return;
        }
        
        document.querySelector('.update-start-btn').style.display = 'none';
        this.updateStatus('מוריד רשימת קבצים...');
        this.addToLog('מתחיל עדכון');
        
        try {
            // קבלת רשימת כל הקבצים מהרפוזיטורי
            const treeResponse = await fetch(`${this.apiBase}/git/trees/${this.latestCommit.sha}?recursive=1`);
            if (!treeResponse.ok) {
                throw new Error(`Failed to fetch file tree: ${treeResponse.status}`);
            }
            
            const treeData = await treeResponse.json();
            const files = treeData.tree.filter(item => 
                item.type === 'blob' && 
                !this.excludeFiles.some(exclude => item.path.includes(exclude))
            );
            
            this.addToLog(`נמצאו ${files.length} קבצים לעדכון`);
            
            let completed = 0;
            const total = files.length;
            
            for (const file of files) {
                await this.updateFile(file);
                completed++;
                const percentage = (completed / total) * 100;
                this.updateProgress(percentage);
                this.updateStatus(`מעדכן קבצים... (${completed}/${total})`);
            }
            
            // עדכון הגרסה המקומית
            this.currentVersion.commit = this.latestCommit.sha;
            this.currentVersion.lastUpdate = new Date().toISOString();
            await this.saveCurrentVersion();
            
            this.updateStatus('העדכון הושלם בהצלחה! 🎉');
            this.addToLog('העדכון הושלם בהצלחה');
            
            // הצגת כפתור איתחול
            setTimeout(() => {
                if (this.isElectron) {
                    this.updateStatus('העדכון הושלם! האפליקציה תאותחל תוך 3 שניות...');
                    setTimeout(() => {
                        const { app } = window.require('electron').remote || window.require('@electron/remote');
                        app.relaunch();
                        app.exit();
                    }, 3000);
                } else {
                    this.updateStatus('העדכון הושלם! הדף יאותחל תוך 3 שניות...');
                    setTimeout(() => {
                        window.location.reload();
                    }, 3000);
                }
            }, 2000);
            
        } catch (error) {
            console.error('Error during update:', error);
            this.updateStatus('שגיאה בעדכון: ' + error.message);
            this.addToLog('שגיאה בעדכון: ' + error.message);
        }
    }
    
    // עדכון קובץ בודד
    async updateFile(fileInfo) {
        try {
            const fileUrl = `${this.rawBase}/${fileInfo.path}`;
            this.addToLog(`מוריד: ${fileInfo.path}`);
            
            const response = await fetch(fileUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch ${fileInfo.path}: ${response.status}`);
            }
            
            if (this.isElectron) {
                // Electron mode - save to file system
                const fs = window.require('fs').promises;
                const path = window.require('path');
                const filePath = path.join(process.cwd(), fileInfo.path);
                
                // יצירת התיקייה אם לא קיימת
                const dir = path.dirname(filePath);
                await fs.mkdir(dir, { recursive: true });
                
                // בדיקה אם הקובץ בינארי או טקסט
                const contentType = response.headers.get('content-type') || '';
                const isBinary = this.isBinaryFile(fileInfo.path, contentType);
                
                if (isBinary) {
                    const buffer = await response.arrayBuffer();
                    await fs.writeFile(filePath, new Uint8Array(buffer));
                } else {
                    const text = await response.text();
                    await fs.writeFile(filePath, text, 'utf8');
                }
                
            } else {
                // Browser mode - can't save files, just log
                this.addToLog(`(דפדפן) לא ניתן לשמור: ${fileInfo.path}`);
            }
            
        } catch (error) {
            console.error(`Error updating file ${fileInfo.path}:`, error);
            this.addToLog(`שגיאה בעדכון ${fileInfo.path}: ${error.message}`);
        }
    }
    
    // בדיקה אם קובץ הוא בינארי
    isBinaryFile(filePath, contentType) {
        const binaryExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.ico', '.mp3', '.wav', '.mp4', '.avi', '.mov', '.pdf', '.zip', '.rar'];
        const binaryTypes = ['image/', 'audio/', 'video/', 'application/octet-stream'];
        
        const ext = filePath.toLowerCase().substring(filePath.lastIndexOf('.'));
        return binaryExtensions.includes(ext) || binaryTypes.some(type => contentType.includes(type));
    }
}

// אתחול המעדכן כשהדף נטען
let gameUpdater;
document.addEventListener('DOMContentLoaded', function() {
    gameUpdater = new GameUpdater();
    
    // המתן קצת ואז הוסף את הכפתור
    setTimeout(() => {
        gameUpdater.addCheckUpdatesButton();
    }, 1000);
});

// ייצוא עבור שימוש חיצוני
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameUpdater;
}
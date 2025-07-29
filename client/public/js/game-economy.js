/**
 * نظام الاقتصاد للألعاب - خوارزمية رياضية لمزامنة الرصيد
 * Game Economy System - Mathematical Algorithm for Balance Synchronization
 */

class GameEconomy {
    constructor() {
        this.BACKEND_URL = window.location.origin;
        this.MAX_WIN_PERCENTAGE = 0.10; // 10% حد أقصى للربح
        this.MIN_BET_AMOUNT = 10; // أقل مبلغ رهان
        this.MAX_BET_AMOUNT = 1000; // أكبر مبلغ رهان
        this.HOUSE_EDGE = 0.05; // 5% ميزة البيت
        this.playerData = null;
        this.gameSession = null;
    }

    /**
     * تهيئة جلسة اللعب
     */
    async initializeGameSession(gameType, betAmount = 0) {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('يجب تسجيل الدخول أولاً');
            }

            // جلب بيانات اللاعب
            const response = await fetch(`${this.BACKEND_URL}/api/users/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('فشل في جلب بيانات اللاعب');
            }

            this.playerData = await response.json();
            
            // إنشاء جلسة لعب جديدة
            this.gameSession = {
                gameType: gameType,
                startTime: Date.now(),
                betAmount: betAmount,
                initialBalance: this.playerData.coins || 0,
                currentBalance: this.playerData.coins || 0,
                totalSpent: 0,
                totalWon: 0,
                gamesPlayed: 0,
                maxWinAllowed: this.calculateMaxWin(betAmount),
                sessionId: this.generateSessionId()
            };

            return this.gameSession;
        } catch (error) {
            console.error('خطأ في تهيئة جلسة اللعب:', error);
            throw error;
        }
    }

    /**
     * خوارزمية حساب الحد الأقصى للربح
     */
    calculateMaxWin(betAmount) {
        const baseWin = betAmount * (1 + this.MAX_WIN_PERCENTAGE);
        const sessionLimit = this.playerData.coins * this.MAX_WIN_PERCENTAGE;
        return Math.min(baseWin, sessionLimit);
    }

    /**
     * خوارزمية تحديد نتيجة اللعبة
     */
    calculateGameResult(playerScore, gameType, betAmount) {
        // خوارزمية رياضية لضمان عدم تجاوز حد الربح
        const randomFactor = Math.random();
        const skillFactor = this.calculateSkillFactor(playerScore, gameType);
        const economicFactor = this.calculateEconomicFactor(betAmount);
        
        // معادلة النتيجة النهائية
        const winProbability = (skillFactor * 0.6) + (randomFactor * 0.3) + (economicFactor * 0.1);
        
        // تطبيق ميزة البيت
        const adjustedProbability = winProbability * (1 - this.HOUSE_EDGE);
        
        // تحديد النتيجة
        const isWin = adjustedProbability > 0.5;
        const winAmount = isWin ? this.calculateWinAmount(betAmount, adjustedProbability) : 0;
        
        return {
            isWin: isWin,
            winAmount: winAmount,
            lossAmount: isWin ? 0 : betAmount,
            probability: adjustedProbability,
            skillFactor: skillFactor,
            economicFactor: economicFactor
        };
    }

    /**
     * حساب عامل المهارة بناءً على الأداء
     */
    calculateSkillFactor(score, gameType) {
        switch (gameType) {
            case 'speed-challenge':
                return Math.min(score / 100, 1.0); // تطبيع النقاط
            case 'mind-puzzles':
                return Math.min(score / 50, 1.0);
            case 'memory-match':
                return Math.min((100 - score) / 100, 1.0); // أقل حركات = أفضل
            case 'fruit-catching':
                return Math.min(score / 200, 1.0);
            case 'lucky-boxes':
                return 0.5; // لعبة حظ خالصة
            default:
                return 0.5;
        }
    }

    /**
     * حساب العامل الاقتصادي
     */
    calculateEconomicFactor(betAmount) {
        const balanceRatio = this.gameSession.currentBalance / this.gameSession.initialBalance;
        
        // إذا كان الرصيد منخفض، زيادة فرص الربح قليلاً
        if (balanceRatio < 0.3) {
            return 0.6;
        } else if (balanceRatio > 2.0) {
            // إذا كان الرصيد مرتفع، تقليل فرص الربح
            return 0.3;
        }
        
        return 0.5; // متوازن
    }

    /**
     * حساب مبلغ الربح
     */
    calculateWinAmount(betAmount, probability) {
        const basePayout = betAmount * (1 + (probability * this.MAX_WIN_PERCENTAGE * 2));
        const maxAllowed = this.gameSession.maxWinAllowed;
        
        return Math.min(basePayout, maxAllowed);
    }

    /**
     * تحديث رصيد اللاعب
     */
    async updatePlayerBalance(result) {
        try {
            const token = localStorage.getItem('token');
            const balanceChange = result.isWin ? result.winAmount : -(result.lossAmount || 0);

            // التحقق من وجود الجلسة
            if (!this.gameSession) {
                console.warn('⚠️ جلسة اللعبة غير متاحة، تخطي تحديث الرصيد');
                return { success: false, error: 'No game session' };
            }

            // لا تعدل الرصيد محلياً هنا
            // this.gameSession.currentBalance += balanceChange;
            // this.gameSession.totalSpent += (result.lossAmount || 0);
            // this.gameSession.totalWon += (result.winAmount || 0);
            // this.gameSession.gamesPlayed++;

            // مزامنة مع قاعدة البيانات
            const response = await fetch(`${this.BACKEND_URL}/api/users/update-balance`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    balanceChange: balanceChange,
                    gameType: this.gameSession.gameType,
                    sessionId: this.gameSession.sessionId,
                    gameResult: result
                })
            });

            if (!response.ok) {
                throw new Error('فشل في تحديث الرصيد');
            }

            const updatedData = await response.json();
            this.playerData.coins = updatedData.newBalance;
            // حدث الرصيد المحلي فقط من السيرفر
            this.gameSession.currentBalance = updatedData.newBalance;

            return {
                success: true,
                newBalance: updatedData.newBalance,
                change: balanceChange
            };

        } catch (error) {
            console.error('خطأ في تحديث الرصيد:', error);
            throw error;
        }
    }

    /**
     * التحقق من إمكانية اللعب
     */
    canPlay(betAmount) {
        if (!this.gameSession) {
            return { canPlay: false, reason: 'لم يتم تهيئة الجلسة' };
        }

        if (this.gameSession.currentBalance < betAmount) {
            return { canPlay: false, reason: 'رصيد غير كافي' };
        }

        if (betAmount < this.MIN_BET_AMOUNT) {
            return { canPlay: false, reason: `الحد الأدنى للرهان ${this.MIN_BET_AMOUNT} عملة` };
        }

        if (betAmount > this.MAX_BET_AMOUNT) {
            return { canPlay: false, reason: `الحد الأقصى للرهان ${this.MAX_BET_AMOUNT} عملة` };
        }

        return { canPlay: true };
    }

    /**
     * إنهاء جلسة اللعب
     */
    async endGameSession() {
        if (!this.gameSession) return;

        try {
            const token = localStorage.getItem('token');
            const sessionData = {
                ...this.gameSession,
                endTime: Date.now(),
                duration: Date.now() - this.gameSession.startTime,
                netResult: this.gameSession.totalWon - this.gameSession.totalSpent
            };

            // حفظ إحصائيات الجلسة
            await fetch(`${this.BACKEND_URL}/api/games/session-end`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(sessionData)
            });

            this.gameSession = null;
        } catch (error) {
            console.error('خطأ في إنهاء الجلسة:', error);
        }
    }

    /**
     * جلب إحصائيات اللاعب
     */
    async getPlayerStats() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${this.BACKEND_URL}/api/games/player-stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('خطأ في جلب الإحصائيات:', error);
        }
        return null;
    }

    /**
     * توليد معرف جلسة فريد
     */
    generateSessionId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * الحصول على بيانات الجلسة الحالية
     */
    getCurrentSession() {
        return this.gameSession;
    }

    /**
     * الحصول على بيانات اللاعب
     */
    getPlayerData() {
        return this.playerData;
    }
}

// إنشاء مثيل عام للاستخدام
window.gameEconomy = new GameEconomy();

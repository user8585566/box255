// اختبار Agora API - INFINITYBOX25
const API_BASE = 'http://localhost:5001';

// بيانات اختبار
const TEST_USER = {
    username: 'ASD',
    password: '112233'
};

let authToken = null;

// دالة تسجيل الدخول
async function login() {
    try {
        console.log('🔐 بدء تسجيل الدخول...');
        
        const response = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(TEST_USER)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        authToken = data.token;
        
        console.log('✅ تم تسجيل الدخول بنجاح');
        console.log('👤 المستخدم:', data.user.username);
        console.log('🆔 Player ID:', data.user.playerId);
        
        return data;
    } catch (error) {
        console.error('❌ فشل في تسجيل الدخول:', error.message);
        throw error;
    }
}

// الحصول على إعدادات Agora
async function getAgoraConfig() {
    try {
        console.log('⚙️ جاري الحصول على إعدادات Agora...');
        
        const response = await fetch(`${API_BASE}/api/agora/config`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const config = await response.json();
        
        console.log('✅ تم الحصول على إعدادات Agora');
        console.log('📊 الإعدادات:');
        console.log('  - App ID:', config.appId);
        console.log('  - Channel Name:', config.channelName);
        console.log('  - Has App Certificate:', config.hasAppCertificate);
        
        return config;
    } catch (error) {
        console.error('❌ فشل في الحصول على إعدادات Agora:', error.message);
        throw error;
    }
}

// الحصول على Agora Token
async function getAgoraToken(channelName, uid) {
    try {
        console.log('🔑 جاري الحصول على Agora Token...');
        
        const response = await fetch(`${API_BASE}/api/agora/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                channelName: channelName || 'infinitybox25-voice-room',
                uid: uid || 'test-user-123'
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const tokenData = await response.json();
        
        console.log('✅ تم الحصول على Agora Token');
        console.log('📊 معلومات Token:');
        console.log('  - Token:', tokenData.token ? 'موجود' : 'null');
        console.log('  - App ID:', tokenData.appId);
        console.log('  - Channel:', tokenData.channelName);
        console.log('  - UID:', tokenData.uid);
        if (tokenData.expiresAt) {
            console.log('  - ينتهي في:', new Date(tokenData.expiresAt).toLocaleString());
        }
        
        return tokenData;
    } catch (error) {
        console.error('❌ فشل في الحصول على Agora Token:', error.message);
        throw error;
    }
}

// اختبار الغرفة الصوتية مع Agora
async function testVoiceRoomWithAgora() {
    try {
        console.log('🎤 بدء اختبار الغرفة الصوتية مع Agora...');
        
        // الحصول على بيانات الغرفة الصوتية
        const roomResponse = await fetch(`${API_BASE}/api/voice-room`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (!roomResponse.ok) {
            throw new Error(`HTTP ${roomResponse.status}: ${roomResponse.statusText}`);
        }

        const roomData = await roomResponse.json();
        
        console.log('✅ تم الحصول على بيانات الغرفة الصوتية');
        console.log('📊 معلومات الغرفة:');
        console.log('  - الاسم:', roomData.name);
        console.log('  - المقاعد:', roomData.seats?.length || 0);
        console.log('  - المستخدمين في المقاعد:', roomData.seats?.filter(s => s.user).length || 0);
        
        // محاولة الانضمام لمقعد
        try {
            const joinResponse = await fetch(`${API_BASE}/api/voice-room/join-seat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ seatNumber: 1 })
            });

            if (joinResponse.ok) {
                console.log('✅ تم الانضمام للمقعد 1');
                
                // الحصول على إعدادات Agora
                const agoraConfig = await getAgoraConfig();
                
                // الحصول على Token
                const tokenData = await getAgoraToken(agoraConfig.channelName, 'test-user');
                
                console.log('🎉 جميع إعدادات Agora جاهزة للاستخدام!');
                
                // مغادرة المقعد
                await fetch(`${API_BASE}/api/voice-room/leave-seat`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    }
                });
                console.log('✅ تم مغادرة المقعد');
                
            } else {
                console.log('⚠️ المقعد مشغول أو غير متاح');
            }
        } catch (seatError) {
            console.log('⚠️ لم يتم الانضمام للمقعد:', seatError.message);
        }
        
        return roomData;
    } catch (error) {
        console.error('❌ فشل في اختبار الغرفة الصوتية:', error.message);
        throw error;
    }
}

// اختبار شامل لـ Agora
async function testAgoraIntegration() {
    try {
        console.log('🚀 بدء اختبار تكامل Agora...');
        
        // 1. الحصول على إعدادات Agora
        const config = await getAgoraConfig();
        
        // 2. الحصول على Token
        const tokenData = await getAgoraToken(config.channelName, 'test-user-integration');
        
        // 3. محاكاة إنشاء عميل Agora (في المتصفح)
        console.log('🔧 محاكاة إنشاء عميل Agora...');
        console.log('📋 معلومات الاتصال:');
        console.log('  - App ID:', tokenData.appId);
        console.log('  - Channel:', tokenData.channelName);
        console.log('  - Token:', tokenData.token ? 'متوفر' : 'غير متوفر');
        console.log('  - UID:', tokenData.uid);
        
        console.log('✅ اختبار تكامل Agora مكتمل بنجاح!');
        
        return {
            config,
            tokenData,
            status: 'success'
        };
        
    } catch (error) {
        console.error('❌ فشل في اختبار تكامل Agora:', error.message);
        throw error;
    }
}

// دالة الاختبار الرئيسية
async function runAgoraTests() {
    console.log('🚀 بدء اختبارات Agora API...\n');
    
    try {
        // 1. تسجيل الدخول
        await login();
        console.log('');
        
        // 2. اختبار إعدادات Agora
        await getAgoraConfig();
        console.log('');
        
        // 3. اختبار Token
        await getAgoraToken();
        console.log('');
        
        // 4. اختبار الغرفة الصوتية مع Agora
        await testVoiceRoomWithAgora();
        console.log('');
        
        // 5. اختبار التكامل الشامل
        await testAgoraIntegration();
        console.log('');
        
        console.log('🎉 جميع اختبارات Agora مكتملة بنجاح!');
        console.log('💡 يمكنك الآن استخدام agora-test.html لاختبار الصوت المباشر');
        
    } catch (error) {
        console.error('❌ فشل في اختبارات Agora:', error.message);
    }
}

// تشغيل الاختبارات إذا تم استدعاء الملف مباشرة
if (typeof window === 'undefined') {
    // Node.js environment
    runAgoraTests();
} else {
    // Browser environment
    window.runAgoraTests = runAgoraTests;
    window.getAgoraConfig = getAgoraConfig;
    window.getAgoraToken = getAgoraToken;
    window.testVoiceRoomWithAgora = testVoiceRoomWithAgora;
    window.testAgoraIntegration = testAgoraIntegration;
    console.log('🔧 استخدم runAgoraTests() لتشغيل جميع الاختبارات');
    console.log('🔧 أو استخدم الدوال الفردية للاختبار المحدد');
}

// ES Module exports
export {
    login,
    getAgoraConfig,
    getAgoraToken,
    testVoiceRoomWithAgora,
    testAgoraIntegration,
    runAgoraTests
};

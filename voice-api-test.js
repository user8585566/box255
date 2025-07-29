// اختبار API الغرفة الصوتية
const API_BASE = 'https://infinitybox25.onrender.com';

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

// دالة الحصول على الغرفة الصوتية
async function getVoiceRoom() {
    try {
        console.log('🎤 جاري الحصول على الغرفة الصوتية...');
        
        const response = await fetch(`${API_BASE}/api/voice-room`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const roomData = await response.json();
        
        console.log('✅ تم الحصول على الغرفة الصوتية');
        console.log('📊 معلومات الغرفة:');
        console.log('  - الاسم:', roomData.name);
        console.log('  - الوصف:', roomData.description);
        console.log('  - المقاعد:', roomData.seats?.length || 0);
        console.log('  - الحد الأقصى للمستخدمين:', roomData.maxUsers);
        console.log('  - المستخدمين في المقاعد:', roomData.seats?.filter(s => s.user).length || 0);
        console.log('  - قائمة الانتظار:', roomData.waitingQueue?.length || 0);
        
        return roomData;
    } catch (error) {
        console.error('❌ فشل في الحصول على الغرفة الصوتية:', error.message);
        throw error;
    }
}

// دالة الحصول على رسائل الغرفة الصوتية
async function getVoiceRoomMessages() {
    try {
        console.log('💬 جاري الحصول على رسائل الغرفة الصوتية...');
        
        const response = await fetch(`${API_BASE}/api/voice-room/messages`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const messages = await response.json();
        
        console.log('✅ تم الحصول على رسائل الغرفة الصوتية');
        console.log('📝 عدد الرسائل:', messages.length);
        
        if (messages.length > 0) {
            console.log('📄 آخر 3 رسائل:');
            messages.slice(-3).forEach((msg, index) => {
                console.log(`  ${index + 1}. ${msg.sender?.username || 'Unknown'}: ${msg.content}`);
            });
        }
        
        return messages;
    } catch (error) {
        console.error('❌ فشل في الحصول على رسائل الغرفة الصوتية:', error.message);
        throw error;
    }
}

// دالة الانضمام لمقعد
async function joinSeat(seatNumber) {
    try {
        console.log(`🪑 جاري الانضمام للمقعد ${seatNumber}...`);
        
        const response = await fetch(`${API_BASE}/api/voice-room/join-seat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ seatNumber })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        
        console.log('✅ تم الانضمام للمقعد بنجاح');
        console.log('🪑 المقعد:', result.seatNumber);
        console.log('👤 المستخدم:', result.user?.username);
        
        return result;
    } catch (error) {
        console.error('❌ فشل في الانضمام للمقعد:', error.message);
        throw error;
    }
}

// دالة مغادرة المقعد
async function leaveSeat() {
    try {
        console.log('🚪 جاري مغادرة المقعد...');
        
        const response = await fetch(`${API_BASE}/api/voice-room/leave-seat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        
        console.log('✅ تم مغادرة المقعد بنجاح');
        
        return result;
    } catch (error) {
        console.error('❌ فشل في مغادرة المقعد:', error.message);
        throw error;
    }
}

// دالة إرسال رسالة
async function sendMessage(content) {
    try {
        console.log('💬 جاري إرسال رسالة...');
        
        const response = await fetch(`${API_BASE}/api/voice-room/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ content })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        
        console.log('✅ تم إرسال الرسالة بنجاح');
        console.log('📝 الرسالة:', result.content);
        
        return result;
    } catch (error) {
        console.error('❌ فشل في إرسال الرسالة:', error.message);
        throw error;
    }
}

// دالة اختبار WebSocket
function testWebSocket() {
    return new Promise((resolve, reject) => {
        console.log('🌐 جاري اختبار WebSocket...');
        
        const ws = new WebSocket('wss://infinitybox25.onrender.com');
        
        ws.onopen = () => {
            console.log('✅ تم الاتصال بـ WebSocket بنجاح');
            
            // إرسال رسالة اختبار
            ws.send(JSON.stringify({
                type: 'test',
                data: { message: 'Hello from API test' }
            }));
            
            setTimeout(() => {
                ws.close();
                resolve();
            }, 2000);
        };
        
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('📨 رسالة من WebSocket:', data);
            } catch (error) {
                console.log('📨 رسالة نصية:', event.data);
            }
        };
        
        ws.onerror = (error) => {
            console.error('❌ خطأ في WebSocket:', error);
            reject(error);
        };
        
        ws.onclose = () => {
            console.log('🔌 تم إغلاق اتصال WebSocket');
        };
    });
}

// دالة الاختبار الرئيسية
async function runTests() {
    console.log('🚀 بدء اختبارات API الغرفة الصوتية...\n');
    
    try {
        // 1. تسجيل الدخول
        await login();
        console.log('');
        
        // 2. الحصول على الغرفة الصوتية
        await getVoiceRoom();
        console.log('');
        
        // 3. الحصول على الرسائل
        await getVoiceRoomMessages();
        console.log('');
        
        // 4. اختبار WebSocket
        await testWebSocket();
        console.log('');
        
        // 5. إرسال رسالة اختبار
        await sendMessage('رسالة اختبار من API Test');
        console.log('');
        
        // 6. محاولة الانضمام لمقعد (إذا كان متاحاً)
        try {
            await joinSeat(1);
            console.log('');
            
            // 7. مغادرة المقعد
            await leaveSeat();
            console.log('');
        } catch (error) {
            console.log('⚠️ المقعد مشغول أو غير متاح');
        }
        
        console.log('✅ جميع الاختبارات مكتملة بنجاح!');
        
    } catch (error) {
        console.error('❌ فشل في الاختبارات:', error.message);
    }
}

// تشغيل الاختبارات إذا تم استدعاء الملف مباشرة
if (typeof window === 'undefined') {
    // Node.js environment
    runTests();
} else {
    // Browser environment
    window.runVoiceTests = runTests;
    console.log('🔧 استخدم runVoiceTests() لتشغيل الاختبارات');
}

module.exports = {
    login,
    getVoiceRoom,
    getVoiceRoomMessages,
    joinSeat,
    leaveSeat,
    sendMessage,
    testWebSocket,
    runTests
}; 
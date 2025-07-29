// للتطوير في Replit: استخدم الباكند المحلي
// للتطوير في Replit: استخدم الباكند المحلي
// للإنتاج على Netlify: استخدم Render backend
// افتراضيًا استعمل نفس المضيف المحلي عند عدم تحديد VITE_API_URL
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle session expired/multiple login
        if (response.status === 401 && errorData.code === 'MULTIPLE_LOGIN') {
          this.token = null;
          localStorage.removeItem('token');
          localStorage.removeItem('username');
          localStorage.removeItem('isAdmin');
          window.location.reload();
        }
        
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication
  async login(username: string, password: string) {
    const response = await this.request<{
      token: string;
      user: any;
      message: string;
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    this.token = response.token;
    localStorage.setItem('token', response.token);
    localStorage.setItem('username', response.user.username);
    localStorage.setItem('isAdmin', response.user.isAdmin ? 'true' : 'false');

    return {
      ...response,
      username: response.user.username,
      isAdmin: response.user.isAdmin
    };
  }

  async register(username: string, email: string, password: string) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
  }

  async logout() {
    try {
      // Notify server of logout to clear session
      await this.request('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      // Continue with logout even if server request fails
    }
    
    this.token = null;
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('isAdmin');
  }

  // User management
  async getCurrentUser() {
    return this.request('/api/user');
  }

  async updateProfile(data: any) {
    return this.request('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append('avatar', file);

    return this.request('/api/users/upload-avatar', {
      method: 'POST',
      headers: {}, // Remove Content-Type to let browser set it for FormData
      body: formData,
    });
  }

  // Admin methods
  async getAllUsersAdmin() {
    return this.request('/api/admin/users');
  }

  async searchUsersAdmin(searchTerm: string) {
    return this.request(`/api/users/admin/search?q=${encodeURIComponent(searchTerm)}`);
  }

  async updateUserAdmin(userId: string, updates: any) {
    return this.request(`/api/users/admin/update/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // تحديث العملات
  async updateCurrency(goldCoins: number, pearls: number) {
    return this.request('/api/user/currency', {
      method: 'PUT',
      body: JSON.stringify({ goldCoins, pearls })
    });
  }

  // جلب الإشعارات
  async getNotifications() {
    return this.request('/api/notifications');
  }

  // تحديد إشعار كمقروء
  async markNotificationAsRead(notificationId: string) {
    return this.request(`/api/notifications/${notificationId}/read`, {
      method: 'PUT'
    });
  }

  // تحديد جميع الإشعارات كمقروءة
  async markAllNotificationsAsRead() {
    return this.request('/api/notifications/mark-all-read', {
      method: 'PUT'
    });
  }

  // جلب المحادثات
  async getMessages(userId: string) {
    return this.request(`/api/messages/${userId}`);
  }

  // إرسال رسالة
  async sendMessage(recipientId: string, content: string, messageType: string = 'text') {
    return this.request('/api/messages', {
      method: 'POST',
      body: JSON.stringify({ recipientId, content, messageType })
    });
  }

  // جلب الأصدقاء
  async getFriends() {
    return this.request('/api/profile/friends');
  }

  // جلب طلبات الصداقة
  async getFriendRequests() {
    return this.request('/api/profile/friend-requests');
  }

  // إرسال طلب صداقة
  async sendFriendRequest(friendId: string) {
    return this.request('/api/profile/friend-request', {
      method: 'POST',
      body: JSON.stringify({ friendId })
    });
  }

  // قبول طلب صداقة
  async acceptFriendRequest(friendshipId: string) {
    return this.request('/api/profile/accept-friend', {
      method: 'POST',
      body: JSON.stringify({ friendshipId })
    });
  }

  // فحص حالة الصداقة
  async checkFriendship(friendId: string) {
    return this.request(`/api/friends/check/${friendId}`);
  }

  // البحث عن مستخدم برقم اللاعب
  async searchUserById(playerId: string) {
    return this.request(`/api/users/search-by-id/${playerId}`);
  }

  // تحويل الذهب إلى لآلئ
  async exchangeGoldToPearls(goldAmount: number) {
    return this.request('/api/profile/exchange-gold-to-pearls', {
      method: 'POST',
      body: JSON.stringify({ goldAmount })
    });
  }

  // إرسال عنصر
  async sendItem(toUserId: string, itemType: string, message?: string) {
    return this.request('/api/profile/send-item', {
      method: 'POST',
      body: JSON.stringify({ toUserId, itemType, message })
    });
  }

  // جلب الهدايا
  async getGifts() {
    return this.request('/api/profile/gifts');
  }

  // إرسال هدية
  async sendGift(toUserId: string, giftType: string, amount: number, message?: string) {
    return this.request('/api/profile/send-gift', {
      method: 'POST',
      body: JSON.stringify({ toUserId, giftType, amount, message })
    });
  }

  // استلام هدية
  async claimGift(giftId: string) {
    return this.request('/api/profile/claim-gift', {
      method: 'POST',
      body: JSON.stringify({ giftId })
    });
  }

  // جلب العناصر والدروع
  async getItems() {
    return this.request('/api/profile/items');
  }

  // ========== VOICE ROOM METHODS ==========

  // جلب بيانات الغرفة الصوتية
  async getVoiceRoom() {
    return this.request('/api/voice-room');
  }

  // الانضمام لمقعد صوتي
  async joinVoiceSeat(seatNumber: number) {
    return this.request('/api/voice-room/join-seat', {
      method: 'POST',
      body: JSON.stringify({ seatNumber })
    });
  }

  // مغادرة المقعد الصوتي
  async leaveVoiceSeat() {
    return this.request('/api/voice-room/leave-seat', {
      method: 'POST'
    });
  }

  // مغادرة المقعد (alias)
  async leaveSeat() {
    return this.leaveVoiceSeat();
  }

  // طلب الانضمام لقائمة انتظار المايك
  async requestMic() {
    return this.request('/api/voice-room/request-mic', {
      method: 'POST'
    });
  }

  // إلغاء طلب المايك
  async cancelMicRequest() {
    return this.request('/api/voice-room/cancel-mic-request', {
      method: 'POST'
    });
  }

  // إرسال رسالة في الغرفة الصوتية
  async sendVoiceRoomMessage(content: string) {
    return this.request('/api/voice-room/send-message', {
      method: 'POST',
      body: JSON.stringify({ content })
    });
  }

  // جلب رسائل الغرفة الصوتية
  async getVoiceRoomMessages() {
    return this.request('/api/voice-room/messages');
  }

  // تحديث حالة المايك (كتم/إلغاء كتم)
  async toggleMute(isMuted: boolean) {
    return this.request('/api/voice-room/toggle-mute', {
      method: 'POST',
      body: JSON.stringify({ isMuted })
    });
  }

  // ========== ADMIN VOICE ROOM METHODS ==========

  // طرد مستخدم من الغرفة الصوتية
  async kickUserFromVoiceRoom(userId: string, durationInMinutes?: number) {
    return this.request('/api/voice-room/admin/kick', {
      method: 'POST',
      body: JSON.stringify({ userId, durationInMinutes })
    });
  }

  // كتم مستخدم في الغرفة الصوتية
  async muteUserInVoiceRoom(userId: string) {
    return this.request('/api/voice-room/admin/mute', {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  }

  // إلغاء كتم مستخدم في الغرفة الصوتية
  async unmuteUserInVoiceRoom(userId: string) {
    return this.request('/api/voice-room/admin/unmute', {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  }

  // إنزال مستخدم من المقعد
  async removeUserFromSeat(userId: string) {
    return this.request('/api/voice-room/admin/remove-seat', {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  }

  // إزالة مستخدم من قائمة الانتظار
  async removeUserFromQueue(userId: string) {
    return this.request('/api/voice-room/admin/remove-queue', {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  }

  // منع مستخدم من الكتابة في المحادثة
  async banUserFromChat(userId: string) {
    return this.request('/api/voice-room/admin/ban-chat', {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  }

  // إلغاء منع مستخدم من الكتابة في المحادثة
  async unbanUserFromChat(userId: string) {
    return this.request('/api/voice-room/admin/unban-chat', {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  }

  // جلب عناصر مستخدم محدد
  async getUserItems(userId: string) {
    return this.request(`/api/user-items/${userId}`);
  }

  // جلب حالة الدرع
  async getShield(userId: string) {
    return this.request(`/api/profile/shield/${userId}`);
  }

  // تفعيل الدرع الواقي
  async activateShield(shieldType: string) {
    return this.request('/api/profile/activate-shield', {
      method: 'POST',
      body: JSON.stringify({ shieldType })
    });
  }

  // جلب المعاملات
  async getTransactions(page: number = 1, limit: number = 20) {
    return this.request(`/api/profile/transactions?page=${page}&limit=${limit}`);
  }

  // شحن الرصيد
  async chargeBalance(amount: number) {
    return this.request('/api/profile/charge-balance', {
      method: 'POST',
      body: JSON.stringify({ amount })
    });
  }

  // تفعيل عنصر
  async activateItem(itemId: string) {
    return this.request('/api/profile/activate-item', {
      method: 'POST',
      body: JSON.stringify({ itemId })
    });
  }

  // جلب إعدادات اللعبة (للأدمن)
  async getGameSettings() {
    return this.request('/api/game/settings');
  }

  // تحديث إعدادات اللعبة (للأدمن)
  async updateGameSettings(settings: any) {
    return this.request('/api/game/settings', {
      method: 'POST',
      body: settings
    });
  }

  // جلب النشاطات المشبوهة (للأدمن)
  async getSuspiciousActivities() {
    return this.request('/api/admin/suspicious-activities');
  }

  // جلب معرف اللاعب (للأدمن)
  async getPlayerId(userId: string) {
    return this.request(`/api/admin/users/${userId}/player-id`);
  }

  // تحديث معرف اللاعب (للأدمن)
  async updatePlayerId(userId: string, playerId: string) {
    return this.request(`/api/admin/users/${userId}/player-id`, {
      method: 'PUT',
      body: JSON.stringify({ playerId })
    });
  }

  // جلب جميع المستخدمين مع الصور (للأدمن)
  async getUsersWithIds(page: number = 1, limit: number = 12, search: string = '') {
    return this.request(`/api/users/admin/users-with-ids?page=${page}&limit=${limit}&search=${search}`);
  }

  // تحديث بيانات المستخدم (للأدمن)
  async updateUser(userId: string, updates: any) {
    return this.request(`/api/users/admin/update/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  // حذف مستخدم (للأدمن)
  async deleteUser(userId: string) {
    return this.request(`/api/users/admin/delete/${userId}`, {
      method: 'DELETE'
    });
  }

  // حذف صورة مستخدم (للأدمن)
  async deleteUserImage(userId: string) {
    return this.request(`/api/users/admin/delete-image/${userId}`, {
      method: 'DELETE'
    });
  }

  // إدارة صورة المستخدم (للأدمن)
  async manageUserImage(targetUserId: string, action: string, imageData?: string, imageType?: string) {
    return this.request('/api/users/admin/manage-user-image', {
      method: 'PUT',
      body: JSON.stringify({ targetUserId, action, imageData, imageType })
    });
  }

  // عرض جميع المستخدمين مع معرفاتهم (للتشخيص)
  async debugAllUsers() {
    return this.request('/api/admin/debug/all-users');
  }

  // تحديث رصيد اللاعب
  async updateBalance(balanceChange: number, gameType: string, sessionId: string, gameResult: any) {
    return this.request('/api/users/update-balance', {
      method: 'POST',
      body: JSON.stringify({ balanceChange, gameType, sessionId, gameResult })
    });
  }

  // جلب بيانات الملف الشخصي للألعاب
  async getGameProfile() {
    return this.request('/api/users/profile');
  }

  // إنهاء جلسة اللعب
  async endGameSession(sessionData: any) {
    return this.request('/api/games/session-end', {
      method: 'POST',
      body: sessionData
    });
  }

  // جلب إحصائيات اللاعب
  async getPlayerStats() {
    return this.request('/api/games/player-stats');
  }

  // Clear local storage and refresh data
  clearLocalData() {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('selectedUser');
    localStorage.removeItem('userCache');
    console.log('🧹 Cleared all local storage data');
  }


}

export const apiService = new ApiService();
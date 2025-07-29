// خدمة النص التنبئي
export class TextPredictionService {
  private commonPhrases: string[] = [
    // تحيات
    'السلام عليكم',
    'وعليكم السلام',
    'أهلاً وسهلاً',
    'مرحباً بكم',
    'حياكم الله',
    'أهلاً بك',
    'مساء الخير',
    'صباح الخير',
    'تصبحون على خير',
    'ليلة سعيدة',
    
    // عبارات شائعة
    'كيف حالكم؟',
    'كيف الأحوال؟',
    'إن شاء الله',
    'ما شاء الله',
    'بارك الله فيك',
    'جزاك الله خيراً',
    'الله يعطيك العافية',
    'تسلم إيدك',
    'الله يبارك فيك',
    'ربي يحفظك',
    
    // ردود فعل
    'ممتاز!',
    'رائع جداً',
    'أحسنت',
    'بالتوفيق',
    'الله يوفقك',
    'نعم صحيح',
    'أوافقك الرأي',
    'هذا صحيح',
    'بالضبط',
    'تماماً',
    
    // أسئلة شائعة
    'من أين أنت؟',
    'كم عمرك؟',
    'ما اسمك؟',
    'أين تسكن؟',
    'ما هو عملك؟',
    'هل أنت متزوج؟',
    'كم طفل لديك؟',
    'ما هوايتك؟',
    
    // عبارات الوداع
    'مع السلامة',
    'إلى اللقاء',
    'نراكم قريباً',
    'الله معكم',
    'في أمان الله',
    'وداعاً',
    'إلى اللقاء قريباً',
    
    // عبارات الألعاب
    'هيا نلعب',
    'من يريد اللعب؟',
    'لعبة جميلة',
    'أحب هذه اللعبة',
    'فزت!',
    'خسرت',
    'لعبة أخرى؟',
    'تحدي جديد',
    
    // عبارات الدعم
    'لا تحزن',
    'كله خير',
    'الله معك',
    'ستتحسن الأمور',
    'لا تيأس',
    'كن قوياً',
    'أنا معك',
    'سأساعدك',
    
    // عبارات المجاملة
    'شكراً لك',
    'عفواً',
    'لا شكر على واجب',
    'أعتذر',
    'آسف',
    'لا بأس',
    'لا مشكلة',
    'بالعكس',
    
    // عبارات الطعام
    'أنا جائع',
    'ما رأيكم في الطعام؟',
    'هل تناولتم الطعام؟',
    'طعام لذيذ',
    'أحب هذا الطبق',
    'وجبة شهية',
    
    // عبارات الطقس
    'الجو جميل اليوم',
    'الطقس حار',
    'الطقس بارد',
    'يبدو أنه سيمطر',
    'الشمس مشرقة',
    'الجو معتدل'
  ];

  private recentMessages: string[] = [];

  // إضافة رسالة جديدة للتاريخ
  addMessage(message: string) {
    this.recentMessages.unshift(message);
    // الاحتفاظ بآخر 50 رسالة فقط
    if (this.recentMessages.length > 50) {
      this.recentMessages = this.recentMessages.slice(0, 50);
    }
  }

  // الحصول على اقتراحات بناءً على النص المدخل
  getSuggestions(input: string): string[] {
    if (!input || input.length < 2) return [];

    const inputLower = input.toLowerCase().trim();
    const suggestions: string[] = [];

    // البحث في العبارات الشائعة
    this.commonPhrases.forEach(phrase => {
      if (phrase.toLowerCase().includes(inputLower)) {
        suggestions.push(phrase);
      }
    });

    // البحث في الرسائل الحديثة
    this.recentMessages.forEach(message => {
      if (message.toLowerCase().includes(inputLower) && 
          !suggestions.includes(message) && 
          message.length > input.length) {
        suggestions.push(message);
      }
    });

    // ترتيب الاقتراحات حسب الطول والشيوع
    return suggestions
      .sort((a, b) => {
        // إعطاء أولوية للعبارات الأقصر
        const lengthDiff = a.length - b.length;
        if (lengthDiff !== 0) return lengthDiff;
        
        // إعطاء أولوية للعبارات الشائعة
        const aIsCommon = this.commonPhrases.includes(a);
        const bIsCommon = this.commonPhrases.includes(b);
        if (aIsCommon && !bIsCommon) return -1;
        if (!aIsCommon && bIsCommon) return 1;
        
        return 0;
      })
      .slice(0, 5); // أقصى 5 اقتراحات
  }

  // الحصول على اقتراحات سريعة (عبارات شائعة)
  getQuickSuggestions(): string[] {
    return [
      'السلام عليكم',
      'كيف حالكم؟',
      'أهلاً وسهلاً',
      'شكراً لك',
      'مع السلامة'
    ];
  }

  // إضافة عبارات مخصصة
  addCustomPhrase(phrase: string) {
    if (!this.commonPhrases.includes(phrase)) {
      this.commonPhrases.push(phrase);
    }
  }
}

export const textPredictionService = new TextPredictionService();

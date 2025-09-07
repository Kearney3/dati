import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Simple translation resources
const resources = {
  en: {
    translation: {
      app: {
        title: 'dati',
        subtitle_upload: 'Upload your Excel to begin personalized practice',
        continue_config: 'Continue Configuration',
        reupload: 'Re-upload File',
        uploaded_title: 'Question bank uploaded',
        contains_sheets: 'Contains {{count}} sheets',
        back_home: 'Back to Home',
        configure_bank: 'Configure Question Bank',
        select_and_map: 'Select sheets and configure global mapping',
        start_quiz: 'Start',
        github: 'GitHub',
        footer: '© 2024 dati - Multifunctional quiz app with Excel import',
        made_with: 'Made with ❤️ & Cursor'
      },
      theme: {
        to_day: 'Switch to light mode',
        to_night: 'Switch to dark mode',
        toggle: 'Theme Toggle'
      },
      mapping: {
        title: 'Global Mapping',
        helper: 'Map Excel columns to question fields',
        select_placeholder: '-- Select --',
        labels: {
          question: 'Question',
          type: 'Type',
          answer: 'Answer',
          optionA: 'Option A',
          optionB: 'Option B',
          optionC: 'Option C',
          optionD: 'Option D',
          optionE: 'Option E',
          optionF: 'Option F',
          explanation: 'Explanation'
        },
        status_ok: 'Mapping valid',
        status_ok_desc: 'All required fields are mapped',
        status_missing: 'Global mapping incomplete',
        status_missing_desc: 'Missing required fields: {{fields}}'
      },
      quiz: {
        start_warning_title: 'Please complete global mapping',
        start_warning_desc: 'Complete global mapping first',
        select_sheet_warning_title: 'Select at least one sheet',
        select_sheet_warning_desc: 'Please select at least one sheet',
        cannot_generate_title: 'Unable to generate question bank',
        cannot_generate_desc: 'Check Excel contents or global mapping',
        begin: 'Begin'
      },
      exam: {
        selected_summary: 'Selected {{sheets}} sheets, total {{questions}} questions',
        in_bank_total: 'There are {{count}} questions in bank',
        max_available: 'Up to {{count}} questions',
        count_label: 'Number of questions',
        score_label: 'Score per question',
        range_label: 'Answer range',
        toggle_all: 'Select All',
        toggle_custom: 'Custom',
        range_visualization: 'Range visualization',
        range_n: 'Range {{index}}',
        delete: 'Delete',
        add_range: 'Add range',
        drag_to_move: 'Drag to move range',
        include_all_type: 'Include all questions of this type',
        subtotal: 'Subtotal: {{count}} × {{score}} = {{sum}}',
        total_questions: 'Total: {{count}} questions',
        total_score: 'Full score: {{score}}',
        status_error_title: 'Invalid configuration',
        status_error_desc: 'Found invalid question counts or scores',
        status_zero_title: 'Score setting',
        status_zero_desc: 'Questions configured but score is 0, please check',
        status_none_title: 'Please configure questions',
        status_none_desc: 'Set count for at least one type',
        status_exceed_title: 'Exceeds available',
        status_exceed_desc: 'Configured ({{configured}}) exceeds available ({{available}})',
        status_ok_title: 'Configuration valid',
        status_ok_desc: 'Configured {{configured}} questions, full score {{score}}'
      },
      results: {
        no_wrong_title: 'No wrong questions',
        no_wrong_desc: 'Great! All answers are correct.'
      },
      quizui: {
        prev: 'Previous',
        next: 'Next',
        submit: 'Submit',
        submit_paper: 'Submit Paper',
        early_submit: 'Submit Early',
        early_submit_title: 'Submit Early',
        early_submit_confirm_title: 'Confirm Early Submission',
        early_submit_confirm_desc: 'Are you sure you want to submit early?',
        answered_count: 'Answered: {{answered}} / {{total}}',
        unanswered_count: 'Unanswered: {{count}}',
        hint_answer: 'Hint',
        keyboard_shortcuts: 'Shortcuts',
        keyboard_shortcuts_title: 'Keyboard Shortcuts',
        nav_numbers: 'Navigate',
        back_home: 'Back to Home',
        mobile_swipe_banner: 'On mobile: swipe left/right on the question to navigate',
        wrong_mode_banner: 'Wrong questions mode: practicing {{count}} wrong questions',
        back_full_quiz: 'Back to full quiz',
        progress: '{{current}} / {{total}}',
        swipe_next: 'Next',
        swipe_prev: 'Previous',
        type_label: 'Type',
        fill_placeholder: 'Please enter answer {{index}}',
        correct_answer_title: 'Correct answer',
        answer_correct: 'Correct!',
        answer_wrong: 'Wrong',
        your_answer: 'Your answer:',
        correct_answer: 'Correct answer:',
        explanation: 'Explanation:',
        nav_panel_title: 'Navigation',
        close_nav: 'Close Navigation',
        settings_title: 'Quiz Settings',
        settings_nav_position: 'Navigation buttons position',
        position_bottom: 'Bottom',
        position_top: 'Top',
        swipe_toggle: 'Swipe to switch questions',
        swipe_disabled_tip: 'Swipe disabled. Use buttons to navigate.',
        wrong_mode: 'Wrong questions mode',
        wrong_mode_tip: 'Currently practicing {{count}} wrong questions. Click to return to full quiz.',
        hint_button: 'Hint',
        shortcuts_button: 'Shortcuts',
        settings_button: 'Settings',
        nav_button: 'Navigate',
        back_button: 'Back',
        close: 'Close'
      },
      lang: {
        zh: '中文',
        en: 'English'
      },
      theme_lang_toggle: {
        toggle_menu: 'Toggle Menu',
        theme: 'Theme',
        light_mode: 'Light Mode',
        dark_mode: 'Dark Mode',
        language: 'Language'
      }
    }
  },
  zh: {
    translation: {
      app: {
        title: '智能答题系统',
        subtitle_upload: '上传您的Excel题库，开启个性化刷题之旅',
        continue_config: '继续配置',
        reupload: '重新上传文件',
        uploaded_title: '已上传题库文件',
        contains_sheets: '包含 {{count}} 个工作表',
        back_home: '返回首页',
        configure_bank: '配置题库',
        select_and_map: '选择工作表并配置全局映射',
        start_quiz: '开始答题',
        github: 'GitHub',
        footer: '© 2024 dati - 支持Excel文件导入的多功能测验应用',
        made_with: 'Made with ❤️ & Cursor'
      },
      theme: {
        to_day: '切换到日间模式',
        to_night: '切换到夜间模式',
        toggle: '主题切换'
      },
      mapping: {
        title: '全局映射',
        helper: '将Excel列名与题目属性进行对应',
        select_placeholder: '-- 请选择 --',
        labels: {
          question: '题干',
          type: '题型',
          answer: '答案',
          optionA: '选项A',
          optionB: '选项B',
          optionC: '选项C',
          optionD: '选项D',
          optionE: '选项E',
          optionF: '选项F',
          explanation: '解析'
        },
        status_ok: '映射有效',
        status_ok_desc: '所有必填字段已正确映射',
        status_missing: '全局映射不完整',
        status_missing_desc: '缺少必填字段：{{fields}}'
      },
      quiz: {
        start_warning_title: '请完成全局映射配置',
        start_warning_desc: '请先完成全局映射配置',
        select_sheet_warning_title: '请至少选择一个工作表',
        select_sheet_warning_desc: '请先选择至少一个工作表',
        cannot_generate_title: '无法生成题库',
        cannot_generate_desc: '请检查Excel内容或全局映射是否正确！',
        begin: '开始'
      },
      exam: {
        selected_summary: '已选择 {{sheets}} 个工作表，总计 {{questions}} 题',
        in_bank_total: '题库中共有 {{count}} 题',
        max_available: '最大可出 {{count}} 题',
        count_label: '出题数量',
        score_label: '每题分值',
        range_label: '答题范围',
        toggle_all: '全选',
        toggle_custom: '自定义',
        range_visualization: '范围可视化',
        range_n: '范围 {{index}}',
        delete: '删除',
        add_range: '添加范围',
        drag_to_move: '拖拽移动范围',
        include_all_type: '将答该类型所有题目',
        subtotal: '小计: {{count}} 题 × {{score}} 分 = {{sum}} 分',
        total_questions: '总计: {{count}} 题',
        total_score: '满分: {{score}} 分',
        status_error_title: '配置有误',
        status_error_desc: '存在无效的题目数量或分值设置',
        status_zero_title: '分值设置',
        status_zero_desc: '有题目数量但分值为0，请检查分值设置',
        status_none_title: '请设置题目',
        status_none_desc: '请为至少一种题型设置题目数量',
        status_exceed_title: '题目超限',
        status_exceed_desc: '配置题目数({{configured}})超过可用题目数({{available}})',
        status_ok_title: '配置有效',
        status_ok_desc: '已配置 {{configured}} 题，满分 {{score}} 分'
      },
      results: {
        no_wrong_title: '没有错题',
        no_wrong_desc: '恭喜您！所有题目都答对了，没有错题需要重新练习。'
      },
      quizui: {
        prev: '上一题',
        next: '下一题',
        submit: '提交',
        submit_paper: '提交试卷',
        early_submit: '提前交卷',
        early_submit_title: '提前交卷',
        early_submit_confirm_title: '确认提前交卷',
        early_submit_confirm_desc: '您确定要提前交卷吗？',
        answered_count: '已答题数：{{answered}} / {{total}}',
        unanswered_count: '未答题数：{{count}}',
        hint_answer: '答案提示',
        keyboard_shortcuts: '快捷键',
        keyboard_shortcuts_title: '快捷键提示',
        nav_numbers: '导航',
        back_home: '返回主页',
        mobile_swipe_banner: '移动设备：在题干上左右滑动可切换题目',
        wrong_mode_banner: '错题练习模式：当前正在练习 {{count}} 道错题',
        back_full_quiz: '返回完整题库',
        progress: '{{current}} / {{total}}',
        swipe_next: '下一题',
        swipe_prev: '上一题',
        type_label: '题型',
        fill_placeholder: '请填写第 {{index}} 个答案',
        correct_answer_title: '正确答案',
        answer_correct: '回答正确！',
        answer_wrong: '回答错误',
        your_answer: '您的答案:',
        correct_answer: '正确答案:',
        explanation: '解析:',
        nav_panel_title: '题目导航',
        close_nav: '关闭导航',
        settings_title: '答题设置',
        settings_nav_position: '切题按钮位置',
        position_bottom: '底部',
        position_top: '顶部',
        swipe_toggle: '滑动切换题目',
        swipe_disabled_tip: '已禁用滑动切换，请使用切题按钮切换题目',
        wrong_mode: '错题练习模式',
        wrong_mode_tip: '当前正在练习 {{count}} 道错题，点击按钮可返回完整题库',
        hint_button: '提示答案',
        shortcuts_button: '快捷键',
        settings_button: '答题设置',
        nav_button: '导航',
        back_button: '返回',
        close: '关闭'
      },
      lang: {
        zh: '中文',
        en: 'English'
      },
      theme_lang_toggle: {
        toggle_menu: '切换菜单',
        theme: '主题',
        light_mode: '日间模式',
        dark_mode: '夜间模式',
        language: '语言'
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'zh',
    interpolation: { escapeValue: false },
    detection: {
      order: ['querystring', 'localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

export default i18n;



/**
 * 教員向けコーチマーク（スポットライト）のステップ定義。
 * targetId は各コンポーネントの対象要素の id 属性と対応する。
 * tab で指定したタブへ自動的に切り替わってからコーチマークが表示される。
 * placement: 'bottom' | 'top' | 'auto'
 */
export const TEACHER_TOUR_STEPS = [
    {
        targetId: 'teacher-tour-daily-hours',
        tab: 'home',
        title: '昨日の総学習時間 📊',
        body: 'クラス全体の昨日の総合学習時間が表示されます。カレンダーで日付を選ぶと選択した日の合計学習時間も確認できます！',
        placement: 'bottom',
    },
    {
        targetId: 'teacher-tour-assignments',
        tab: 'home',
        title: '課題の管理 📋',
        body: '課題の進捗状況が一覧で確認できます。各課題の達成率や、完了した生徒・未完了の生徒もここで確認できます！',
        placement: 'bottom',
    },
    {
        targetId: 'teacher-tour-analytics',
        tab: 'analytics',
        title: 'クラスアナリティクス 📈',
        body: '生徒の月別学習時間や科目ごとの内訳をグラフで確認できます。富士山ビューでは全生徒の進捗が一目でわかります！',
        placement: 'bottom',
    },
    {
        targetId: 'teacher-tour-filter',
        tab: 'analytics',
        title: 'フィルター 🎛️',
        body: '文系・理系や選択科目でフィルタリングして、特定グループの生徒に絞った分析ができます。',
        placement: 'bottom',
    },
    {
        targetId: 'teacher-tour-fuji',
        tab: 'analytics',
        title: 'クラス富士山ビュー 🗻',
        body: '生徒全員の進捗状態を富士山上のマッピングで俯瞰できます。光るドットをタップすると生徒名と達成率が確認できます！',
        placement: 'bottom',
    },
    {
        targetId: 'teacher-tour-goals',
        tab: 'analytics',
        title: '目標達成状況ダッシュボード 🎯',
        body: '各生徒の「今日の目標」と「達成率」が並びます。達成率順に並び替えて、未達の生徒をすぐに見つけることができます！',
        placement: 'top',
    },
];

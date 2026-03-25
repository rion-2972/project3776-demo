/**
 * コーチマーク（スポットライト）のステップ定義。
 * targetId は各コンポーネントの対象要素の id 属性と対応する。
 * tab で指定したタブへ自動的に切り替わってからコーチマークが表示される。
 * placement: 'bottom' | 'top' | 'auto'
 */
export const TOUR_STEPS = [
    {
        targetId: 'tour-daily-hours',
        tab: 'home',
        title: '今日の学習時間 ⏱️',
        body: '円グラフ（プログレスリング）をタップすると、今月の日毎の学習時間がカレンダー形式で確認できます。右上のグラフでは直近7日間の学習時間の内訳も確認可能です！',
        placement: 'bottom',
    },
    {
        targetId: 'tour-assignments',
        tab: 'home',
        title: 'クラスの課題 📋',
        body: '登録された課題がここに表示されます。教科係はここに課題を登録しましょう！タップすると学習タイマーがセットされた状態で記録画面が開きます！',
        placement: 'bottom',
    },
    {
        targetId: 'tour-routines',
        tab: 'home',
        title: '日課 🌿',
        body: '毎日やることをここに登録。完了チェックを押すとエフェクトと効果音が鳴ります！',
        placement: 'bottom',
    },
    {
        targetId: 'tour-myplans',
        tab: 'home',
        title: 'マイプラン 📅',
        body: '日付・科目を指定して自分だけの学習プランを作れます。「今日」「明日」「それ以降」でグループ分けして表示されます。',
        placement: 'top',
    },
    {
        targetId: 'tour-quick-input',
        tab: 'record',
        title: 'クイック入力 ⚡',
        body: '最近の学習パターンをワンタップで呼び出せます。毎日同じ科目を記録するときは10秒以内に！',
        placement: 'bottom',
    },
    {
        targetId: 'tour-stopwatch',
        tab: 'record',
        title: 'ストップウォッチ ⏱️',
        body: 'タイマーは他のタブを開いても裏で動き続けます。タブを閉じてしまっても大丈夫！',
        placement: 'bottom',
    },
    {
        targetId: 'tour-reaction-bar',
        tab: 'timeline',
        title: 'リアクション 🔥',
        body: '仲間の記録に絵文字スタンプを送ってお互いに励まし合えます。「+」ボタンで絵文字を選んで送りましょう！',
        placement: 'top',
    },
    {
        targetId: 'tour-fuji-progress',
        tab: 'timeline',
        title: '富士山登頂チャレンジ 🗻',
        body: '毎日の学習時間が山を登る歩みになります。月間目標時間（3,776時間=富士山の標高）に向けてコツコツ登りましょう！',
        placement: 'bottom',
    },
];

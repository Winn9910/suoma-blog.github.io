
/* Win7 界面音效：全部用 WebAudio 实时合成，无需音频文件。
   默认关闭，状态存在 localStorage('win7-sound')。 */
(function () {
    'use strict';

    if (window.win7Sound) return;

    var KEY = 'win7-sound';
    var ctx = null;

    function enabled() {
        try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; }
    }

    function setEnabled(on) {
        try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) { /* ignore */ }
    }

    /* AudioContext 必须在用户手势里创建，所有 play 都由点击触发，天然满足 */
    function audio() {
        if (ctx) return ctx;
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        try { ctx = new AC(); } catch (e) { return null; }
        return ctx;
    }

    /* 一个音符：频率、时长、波形、音量、起始延迟 */
    function tone(freq, dur, type, vol, delay) {
        var ac = audio();
        if (!ac) return;
        if (ac.state === 'suspended') ac.resume();
        var t0 = ac.currentTime + (delay || 0);
        var osc = ac.createOscillator();
        var gain = ac.createGain();
        osc.type = type || 'sine';
        osc.frequency.setValueAtTime(freq, t0);
        /* 快起慢落的包络，像系统音的点击感 */
        gain.gain.setValueAtTime(0, t0);
        gain.gain.linearRampToValueAtTime(vol || 0.08, t0 + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.start(t0);
        osc.stop(t0 + dur + 0.02);
    }

    var BANK = {
        /* 菜单点击：短促高频，几乎听不见但有点击确认感 */
        click: function () { tone(1180, 0.05, 'triangle', 0.05, 0); },
        /* 开窗：两声上行 */
        open: function () { tone(660, 0.09, 'sine', 0.07, 0); tone(990, 0.11, 'sine', 0.06, 0.07); },
        /* 关窗：两声下行 */
        close: function () { tone(880, 0.08, 'sine', 0.06, 0); tone(587, 0.11, 'sine', 0.05, 0.06); },
        /* 操作完成 / 应用设置 */
        ding: function () { tone(1046, 0.26, 'sine', 0.09, 0); },
        /* 错误 / 取消：Win7 那种低沉的“咚咚” */
        error: function () { tone(415, 0.12, 'square', 0.045, 0); tone(311, 0.22, 'square', 0.04, 0.1); },
        /* 切换配色：轻快三连音 */
        swap: function () { tone(784, 0.07, 'sine', 0.05, 0); tone(988, 0.07, 'sine', 0.05, 0.055); tone(1319, 0.12, 'sine', 0.045, 0.11); }
    };

    window.win7Sound = {
        enabled: enabled,
        setEnabled: setEnabled,
        play: function (name) {
            if (!enabled()) return;
            var fn = BANK[name];
            if (fn) { try { fn(); } catch (e) { /* 音频不可用则静默 */ } }
        }
    };
})();

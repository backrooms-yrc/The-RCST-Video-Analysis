(function(){
  const input = document.getElementById('input-url');
  const playBtn = document.getElementById('play-btn');
  const video = document.getElementById('html5-video');
  const iframe = document.getElementById('parser-iframe');
  const meta = document.getElementById('meta');
  const parserSelect = document.getElementById('parser-select');
  const quickParsers = document.getElementById('quick-parsers');

  // 🔗 解析接口（只要在这里加就会自动出现在前端）
  // 2026-08-28 全量探测：虾米/夜幕/m1907 官方链路均存活；aibox 原域名 aibox.eu.org 属 .eu.org，
  // 国内 DNS 普遍被劫持，已改走本站反代 /jx/aibox/（nginx 中转，浏览器只连本站域名）。
  const parsers = [
    { name: "接口1·虾米（高清稳定，首选）", url: "https://jx.xmflv.com/?url=%s" },
    { name: "接口2·M1907（支持 m3u8/mp4 直链）", url: "https://z1.m1907.top/?jx=%s" },
    { name: "接口3·夜幕聚合（自动选择最优线路）", url: "https://www.yemu.xyz/?url=%s" },
    { name: "接口4·臻享视听（已修复DNS劫持，本站中转）", url: "/jx/aibox/?url=%s" },
    { name: "接口5·七七云解析（WASM解码）", url: "https://jx.77flv.cc/?url=%s" },
    // { name: "接口名称", url: "https://xxx.com/?url=%s" }
  ];

  // 填充 select 和快速选择（mdui-select 使用 mdui-menu-item 子项）
  parsers.forEach(p => {
    const opt = document.createElement("mdui-menu-item");
    opt.value = p.url; opt.textContent = "解析器：" + p.name;
    parserSelect.appendChild(opt);

    const btn = document.createElement("button");
    btn.textContent = p.name; btn.dataset.url = p.url;
    quickParsers.appendChild(btn);
  });
  parserSelect.value = parsers[0].url;
  if (quickParsers.firstElementChild) quickParsers.firstElementChild.classList.add('selected');

  // 初始化 Plyr
  try { new Plyr(video); } catch(e){}

  // 模式切换
  const modePlay = document.getElementById('mode-play');
  const modeIframe = document.getElementById('mode-iframe');
  let mode = 'play';
  function setMode(m){
    mode = m;
    modePlay.classList.toggle('active', m==='play');
    modeIframe.classList.toggle('active', m==='iframe');
    video.style.display = (m==='play') ? 'block' : 'none';
    iframe.style.display = (m==='iframe') ? 'block' : 'none';
  }
  modePlay.addEventListener('click', ()=> setMode('play'));
  modeIframe.addEventListener('click', ()=> setMode('iframe'));

  // 快速选择按钮
  quickParsers.addEventListener('click', e=>{
    const btn = e.target.closest('button[data-url]');
    if(!btn) return;
    parserSelect.value = btn.dataset.url;
    [...quickParsers.querySelectorAll('button')].forEach(b => b.classList.toggle('selected', b === btn));
  });

  // 判断是否 m3u8
  function isM3U8(str){
    return /\.m3u8(\?|$)/i.test(str) || (str.startsWith('http') && str.includes('m3u8'));
  }

  // 播放逻辑
  function play(){
    const val = input.value.trim();
    if(!val){ meta.textContent = '状态指示：请输入链接或片名'; return; }

    if(mode==='play' && isM3U8(val)){
      meta.textContent = '状态指示：直接播放 m3u8...';
      if(window._hls){ try{ window._hls.destroy(); }catch(e){} }
      if(video.canPlayType('application/vnd.apple.mpegurl')){
        video.src = val; video.play().catch(()=>{});
      } else if(Hls.isSupported()){
        const hls = new Hls(); window._hls = hls;
        hls.loadSource(val); hls.attachMedia(video);
      } else {
        meta.textContent = '状态指示：浏览器不支持 m3u8';
      }
      setMode('play');
    } else {
      meta.textContent = '状态指示：正在使用解析器加载播放窗口，请稍候...';
      const parser = parserSelect.value || parsers[0].url;
      iframe.src = parser.replace('%s', encodeURIComponent(val));
      setMode('iframe');
    }
  }

  playBtn.addEventListener('click', play);
  input.addEventListener('keydown', e=>{ if(e.key==='Enter') play(); });
  iframe.addEventListener('load', ()=> meta.textContent='状态指示：iframe解析器播放窗口 已加载完成！');
})();

  // 自动弹窗公告（mdui-dialog 通过 open 属性控制）
window.addEventListener("load", () => {
  const modal = document.getElementById("announcement-modal");
  const okBtn = document.getElementById("modal-ok");

  if (modal && okBtn) {
    // 打开
    modal.open = true;

    // 关闭
    okBtn.addEventListener("click", () => {
      modal.open = false;
    });
  }
});

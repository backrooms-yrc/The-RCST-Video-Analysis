(function(){
  const input = document.getElementById('input-url');
  const playBtn = document.getElementById('play-btn');
  const video = document.getElementById('html5-video');
  const iframe = document.getElementById('parser-iframe');
  const meta = document.getElementById('meta');
  const parserSelect = document.getElementById('parser-select');
  const quickParsers = document.getElementById('quick-parsers');
  const searchCard = document.getElementById('search-card');
  const searchTitle = document.getElementById('search-title');
  const searchList = document.getElementById('search-list');
  const episodeWrap = document.getElementById('episode-wrap');
  const episodeList = document.getElementById('episode-list');

  // 🔗 VIP 链接解析接口（iframe 模式，走本站 nginx 中转 /jx/...）
  // 2026-08-28 三轮实测：虾米/七七云/M1907/ik9 在反代下内部 API 失效或跳不良站点，已全部移除；
  // 片名搜索改为本站自建（下方 vodSources），不再依赖第三方解析页。
  const parsers = [
    { name: "接口1·臻享视听（VIP链接解析，本站中转）", url: "/jx/aibox/?url=%s" },
    // { name: "接口名称", url: "/jx/xxx/?url=%s" }
  ];

  // 📚 自建片源：影视资源站采集 API（经本站 /api/vod/ 反代，同源无 CORS/混合内容问题），
  // m3u8 流由浏览器直连资源站国内 CDN，本站只转发轻量 JSON
  const vodSources = [
    { name: "非凡资源", api: "/api/vod/ff/" },
    { name: "360资源", api: "/api/vod/zy360/" },
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

  // m3u8 直连播放（原生 HLS / hls.js 降级）
  function playM3U8(url){
    meta.textContent = '状态指示：正在加载 m3u8 ...';
    if(window._hls){ try{ window._hls.destroy(); }catch(e){} }
    if(video.canPlayType('application/vnd.apple.mpegurl')){
      video.src = url; video.play().catch(()=>{});
      return true;
    } else if(window.Hls && Hls.isSupported()){
      const hls = new Hls(); window._hls = hls;
      hls.loadSource(url); hls.attachMedia(video);
      return true;
    }
    meta.textContent = '状态指示：浏览器不支持 m3u8';
    return false;
  }

  // ===== 自建片源搜索 =====

  // 解析苹果CMS vod_play_url："播放源1###播放源2"，源内 "集名$url#集名$url"
  function parseVodEpisodes(v){
    const sources = (v.vod_play_url || '').split('###').filter(Boolean);
    let best = [], bestScore = -1;
    sources.forEach(seg => {
      const eps = seg.split('#').filter(Boolean).map(e => {
        const i = e.indexOf('$');
        const name = i >= 0 ? e.slice(0, i) : '播放';
        let url = i >= 0 ? e.slice(i + 1) : e;
        try { url = decodeURIComponent(url); } catch(_){}
        return { name, url };
      });
      const score = eps.filter(x => /\.m3u8/i.test(x.url)).length;
      if (score > bestScore) { bestScore = score; best = eps; }
    });
    return best;
  }

  async function fetchVod(src, kw){
    const res = await fetch(src.api + '?ac=detail&wd=' + encodeURIComponent(kw));
    if(!res.ok) throw new Error('HTTP ' + res.status);
    const j = await res.json();
    return (j.list || []).map(v => ({
      name: v.vod_name || '未知片名',
      remarks: v.vod_remarks || '',
      year: v.vod_year || '',
      episodes: parseVodEpisodes(v),
    })).filter(v => v.episodes.length);
  }

  function renderResults(list){
    searchList.innerHTML = '';
    list.slice(0, 12).forEach(v => {
      const btn = document.createElement('button');
      const info = [v.year, v.remarks].filter(Boolean).join(' · ');
      btn.textContent = info ? (v.name + '（' + info + '）') : v.name;
      btn.addEventListener('click', () => renderEpisodes(v));
      searchList.appendChild(btn);
    });
  }

  function renderEpisodes(v){
    episodeWrap.style.display = '';
    episodeList.innerHTML = '';
    v.episodes.forEach(ep => {
      const btn = document.createElement('button');
      btn.textContent = ep.name;
      btn.addEventListener('click', () => {
        [...episodeList.children].forEach(b => b.classList.toggle('selected', b === btn));
        if(playM3U8(ep.url)){
          setMode('play');
          document.getElementById('player-area').scrollIntoView({ behavior:'smooth', block:'nearest' });
        }
      });
      episodeList.appendChild(btn);
    });
  }

  async function searchFlow(kw){
    searchCard.style.display = '';
    episodeWrap.style.display = 'none';
    searchList.innerHTML = '';
    searchTitle.textContent = '搜索结果：' + kw;
    for(const src of vodSources){
      try{
        const list = await fetchVod(src, kw);
        if(list.length){
          meta.textContent = '状态指示：' + src.name + ' 找到 ' + list.length + ' 个结果，点击片名选集播放';
          renderResults(list);
          return;
        }
      } catch(e){ /* 该源失败，自动换下一个 */ }
    }
    meta.textContent = '状态指示：未找到片源。换个关键词试试，或粘贴 VIP 页面链接用解析器播放';
  }

  // 播放逻辑：m3u8 直连 → 网页链接走解析器 → 其余按片名搜索自建片源
  function play(){
    const val = input.value.trim();
    if(!val){ meta.textContent = '状态指示：请输入链接或片名'; return; }

    if(isM3U8(val)){
      if(playM3U8(val)) setMode('play');
    } else if(/^https?:\/\//i.test(val)){
      meta.textContent = '状态指示：正在使用解析器加载播放窗口，请稍候...';
      const parser = parserSelect.value || parsers[0].url;
      iframe.src = parser.replace('%s', encodeURIComponent(val));
      setMode('iframe');
    } else {
      meta.textContent = '状态指示：正在搜索片源，请稍候...';
      searchFlow(val);
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

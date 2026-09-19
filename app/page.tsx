"use client";

import { FormEvent, useEffect, useState, type CSSProperties } from "react";

type Trait = { key: string; title: string; en: string; image: string; color: string; msg: string };
type Memory = { id: number; name: string; message: string; traitKey: string; traitTitle: string; color: string; createdAt: string };

const traits: Trait[] = [
  { key: "vision", title: "عزّنا برؤيتنا", en: "رؤية تتقدم", image: "vision.png", color: "#8f6b25", msg: "نحوّل المعرفة الصيدلانية إلى مبادرات وبحوث تدعم صحة المجتمع ومستقبل الوطن." },
  { key: "courage", title: "عزّنا بشجاعتنا", en: "قرار مسؤول", image: "courage.png", color: "#607c41", msg: "نتمسك بسلامة المريض، ونتخذ القرار العلمي الصحيح بشجاعة ومسؤولية." },
  { key: "determination", title: "عزّنا بهمتنا", en: "طموح لا يتوقف", image: "determination.png", color: "#a31355", msg: "نواصل التعلّم والعمل بإتقان، لأن الهمّة تصنع أثرًا يتجاوز قاعات الدراسة." },
  { key: "authenticity", title: "عزّنا بأصالتنا", en: "قيم راسخة", image: "authenticity.png", color: "#5bab1e", msg: "نجمع بين أصالة قيمنا وحداثة العلم لنقدّم رعاية إنسانية موثوقة." },
  { key: "generosity", title: "عزّنا بكرمنا", en: "عطاء صحي", image: "generosity.png", color: "#0060bf", msg: "نشارك المعرفة ونبادر بالخدمة والتوعية، فالعطاء الصحي صورة من كرم الوطن." },
  { key: "giving", title: "عزّنا بجودنا", en: "أثر يتضاعف", image: "giving.png", color: "#6656e0", msg: "نجود بوقتنا وخبرتنا لنصنع فرقًا حقيقيًا في حياة المرضى والمجتمع." },
];

const questions = [
  { q: "أي قيمة تعبّر عن مواصلة التعلم والعمل بإتقان؟", a: ["عزّنا بهمتنا", "عزّنا بكرمنا", "عزّنا بجودنا"], c: 0 },
  { q: "كيف يترجم طالب الصيدلة قيمة الكرم؟", a: ["بمشاركة المعرفة وخدمة المجتمع", "بالاحتفاظ بالمعلومة", "بتجنب المبادرات"], c: 0 },
  { q: "ما التصرف الذي يجسّد الشجاعة المهنية؟", a: ["اتخاذ القرار العلمي لحماية المريض", "تجاهل الخطأ", "اتباع الرأي دون دليل"], c: 0 },
];

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawContained(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const ratio = Math.min(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * ratio;
  const dh = img.naturalHeight * ratio;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = word; }
    else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

export default function Home() {
  const [expandedTrait, setExpandedTrait] = useState<number | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answerIndex, setAnswerIndex] = useState<number | null>(null);
  const [quizDone, setQuizDone] = useState(false);
  const [selected, setSelected] = useState(traits[0]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [wallLoading, setWallLoading] = useState(true);
  const [wallError, setWallError] = useState("");
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    fetch("/api/memories")
      .then(async (response) => { const data = await response.json() as { memories: Memory[]; error?: string }; if (!response.ok) throw new Error(data.error); setMemories(data.memories); })
      .catch(() => setWallError("تعذر تحميل البصمات الآن. حدّثي الصفحة للمحاولة من جديد."))
      .finally(() => setWallLoading(false));
  }, []);

  function notify(text: string) { setToast(text); window.setTimeout(() => setToast(""), 2600); }

  function answer(index: number) {
    if (answerIndex !== null) return;
    setAnswerIndex(index);
    if (index === questions[questionIndex].c) setScore((value) => value + 1);
    window.setTimeout(() => {
      if (questionIndex + 1 < questions.length) { setQuestionIndex((value) => value + 1); setAnswerIndex(null); }
      else setQuizDone(true);
    }, 800);
  }

  function restartQuiz() { setQuestionIndex(0); setScore(0); setAnswerIndex(null); setQuizDone(false); }

  async function submitMemory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!message.trim()) return;
    setSaving(true);
    try {
      const response = await fetch("/api/memories", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, message, anonymous, traitKey: selected.key }),
      });
      const data = await response.json() as { memory: Memory; error?: string };
      if (!response.ok) throw new Error(data.error);
      setMemories((current) => [data.memory, ...current].slice(0, 100));
      setMessage("");
      setWallError("");
      notify("تمت إضافة بصمتك إلى الجدار العام");
    } catch (error) {
      setWallError(error instanceof Error ? error.message : "تعذر حفظ بصمتك الآن.");
    } finally { setSaving(false); }
  }

  async function downloadCard() {
    setDownloading(true);
    try {
      await document.fonts.ready;
      const [motifImg, sloganImg, clubLogo] = await Promise.all([
        loadImage(`/assets/${selected.image}`), loadImage("/assets/national-slogan.png"), loadImage("/assets/medad-logo.png"),
      ]);
      const canvas = document.createElement("canvas");
      canvas.width = 1080; canvas.height = 1350;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unavailable");
      ctx.fillStyle = "#002f29"; ctx.fillRect(0, 0, 1080, 1350);
      ctx.globalAlpha = 0.18; ctx.drawImage(motifImg, -135, 135, 1350, 1350); ctx.globalAlpha = 1;
      ctx.strokeStyle = "#ab8551"; ctx.lineWidth = 22; ctx.strokeRect(20, 20, 1040, 1310);
      ctx.fillStyle = "rgba(0,25,22,.52)"; ctx.fillRect(52, 52, 976, 122);
      ctx.strokeStyle = "rgba(250,230,206,.35)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(65, 184); ctx.lineTo(1015, 184); ctx.stroke();
      drawContained(ctx, motifImg, 922, 72, 68, 68);
      ctx.direction = "rtl"; ctx.textAlign = "right"; ctx.fillStyle = "#fff"; ctx.font = '700 32px "IBM Plex Sans Arabic"'; ctx.fillText(selected.title, 900, 117);
      drawContained(ctx, clubLogo, 92, 67, 46, 78);
      ctx.textAlign = "left"; ctx.fillStyle = "#fae6ce"; ctx.font = '700 31px "IBM Plex Sans Arabic"'; ctx.fillText("نادي مداد الصيدلة", 155, 116);
      drawContained(ctx, sloganImg, 190, 300, 700, 300);
      ctx.textAlign = "center"; ctx.font = '500 44px "IBM Plex Sans Arabic"'; ctx.fillStyle = "white";
      const cardMessage = message.trim() || "أطمح أن أترك أثرًا صحيًا يخدم مجتمعي ووطننا.";
      wrapText(ctx, cardMessage, 780).slice(0, 4).forEach((line, index) => ctx.fillText(line, 540, 670 + index * 70));
      ctx.fillStyle = "#fae6ce"; ctx.font = '700 38px "IBM Plex Sans Arabic"'; ctx.fillText(anonymous ? "مشارك دون اسم" : (name.trim() || "مشارك من جامعة نجران"), 540, 1010);
      ctx.fillStyle = "rgba(250,230,206,.96)"; ctx.fillRect(90, 1160, 900, 86);
      ctx.fillStyle = "#182f44"; ctx.font = '700 34px "IBM Plex Sans Arabic"'; ctx.fillText("كلية الصيدلة · جامعة نجران", 540, 1218);
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Export failed")), "image/png", 1));
      const filename = "بصمتي-لليوم-الوطني-96.png";
      const file = new File([blob], filename, { type: "image/png" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try { await navigator.share({ files: [file], title: "بطاقتي لليوم الوطني السعودي 96" }); notify("تم إرسال البطاقة إلى خيار الحفظ الذي اخترتِه"); return; }
        catch (error) { if (error instanceof DOMException && error.name === "AbortError") return; }
      }
      const url = URL.createObjectURL(blob); const anchor = document.createElement("a");
      anchor.href = url; anchor.download = filename; document.body.appendChild(anchor); anchor.click(); anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 15000); notify("تم تنزيل البطاقة على جهازك");
    } catch { notify("تعذر حفظ الصورة؛ حاولي مرة أخرى"); }
    finally { setDownloading(false); }
  }

  const displayName = anonymous ? "مشارك دون اسم" : (name.trim() || "مشارك من جامعة نجران");
  const displayMessage = message.trim() || "أطمح أن أترك أثرًا صحيًا يخدم مجتمعي ووطننا.";
  const cardStyle = { "--motif": `url('/assets/${selected.image}')`, "--trait-color": selected.color } as CSSProperties;

  return (
    <>
      <header className="topbar">
        <div className="brand"><div className="brand-logos"><img className="medad-header-logo" src="/assets/medad-logo.png" alt="شعار نادي مداد الصيدلة" /><img className="college-header-logo" src="/assets/pharmacy-logo-white.png" alt="شعار كلية الصيدلة بجامعة نجران" /></div><span>نادي مداد الصيدلة · جامعة نجران</span></div>
        <a className="nav-link" href="#fingerprint">اترك بصمتك</a>
      </header>

      <section className="hero">
        <div className="hero-copy"><p className="eyebrow">نادي مداد الصيدلة يحتفي بالوطن</p><h1 className="national-title"><img src="/assets/saudi-title-white.png" alt="اليوم الوطني السعودي" /><span className="national-title-number">96</span></h1><p>طباعٌ راسخة، وعلمٌ نصنع به أثرًا صحيًا يليق بوطننا.</p><a className="cta" href="#values">اكتشف عزّنا <span aria-hidden="true">←</span></a></div>
        <div className="national-mark"><img src="/assets/national-slogan.png" alt="عزّنا بطبعنا - شعار اليوم الوطني السعودي" /></div>
      </section>

      <main>
        <section id="values"><div className="section-head"><h2>عزّنا بطبعنا</h2><p>اضغط على كل قيمة لتكتشف كيف يترجمها طالب الصيدلة إلى أثر يخدم الوطن.</p></div><div className="traits">{traits.map((trait, index) => <button className="trait" type="button" key={trait.key} style={{ background: trait.color }} aria-expanded={expandedTrait === index} onClick={() => setExpandedTrait(expandedTrait === index ? null : index)}><img src={`/assets/${trait.image}`} alt={`الرسم الرسمي لقيمة ${trait.title}`} /><span className="trait-content"><strong>{trait.title}</strong><small>{trait.en}</small><span className="trait-detail"><span>{trait.msg}</span></span></span></button>)}</div></section>

        <section className="quiz-wrap"><div className="section-head"><h2>اختبر معرفتك</h2><p>ثلاثة أسئلة خفيفة عن قيم الهوية ودور طالب الصيدلة.</p></div><div className="quiz"><div className="progress" aria-hidden="true"><span style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }} /></div>{quizDone ? <div className="quiz-result"><p>{score === 3 ? "ممتاز! قيم الوطن حاضرة فيك." : score === 2 ? "جميل جدًا! تعرف قيم الهوية جيدًا." : "بداية جميلة، أعد التجربة واكتشف القيم أكثر."}</p><button className="option" type="button" onClick={restartQuiz}>إعادة الاختبار</button></div> : <><p className="quiz-question">{questionIndex + 1}. {questions[questionIndex].q}</p><div className="options">{questions[questionIndex].a.map((option, index) => <button type="button" key={option} disabled={answerIndex !== null} onClick={() => answer(index)} className={`option ${answerIndex === index ? (index === questions[questionIndex].c ? "correct" : "wrong") : ""} ${answerIndex !== null && index === questions[questionIndex].c ? "correct" : ""}`}>{option}</button>)}</div></>}</div></section>

        <section className="fingerprint-section" id="fingerprint"><div className="section-head"><h2>اترك بصمتك للوطن</h2><p>اكتب كلمتك، واختر نقشًا يمثل بصمتك، ثم احتفظ ببطاقتك.</p></div><div className="fingerprint-layout">
          <form className="form-card" onSubmit={submitMemory}><label htmlFor="name">الاسم الأول أو اللقب</label><input id="name" maxLength={30} value={name} onChange={(event) => setName(event.target.value)} placeholder="مثال: رغد" /><label htmlFor="message">أثرك أو كلمتك للوطن</label><textarea id="message" maxLength={180} required value={message} onChange={(event) => setMessage(event.target.value)} placeholder="أطمح أن أترك أثرًا صحيًا يخدم مجتمعي ووطننا..." /><div className="count">{message.length}/180</div><label>اختر بصمتك الرقمية</label><div className="motifs" aria-label="اختيار البصمة الرقمية">{traits.map((trait) => <button type="button" className="motif" key={trait.key} style={{ "--motif-color": trait.color } as CSSProperties} aria-label={trait.title} aria-pressed={selected.key === trait.key} onClick={() => setSelected(trait)}><img src={`/assets/${trait.image}`} alt="" /></button>)}</div><label className="anon"><input type="checkbox" checked={anonymous} onChange={(event) => setAnonymous(event.target.checked)} /> نشر البطاقة دون اسم</label><button className="primary" type="submit" disabled={saving}>{saving ? "جارٍ إضافة بصمتك…" : "أضف بصمتك للجدار العام"}</button></form>
          <div className="preview-card"><div className="memory-card" style={cardStyle}><div className="memory-head"><span className="selected-trait"><img src={`/assets/${selected.image}`} alt="" /><span>{selected.title}</span></span><span className="memory-club"><img src="/assets/medad-logo.png" alt="" /><span>نادي مداد الصيدلة</span></span></div><div className="memory-copy"><img className="card-national-slogan" src="/assets/national-slogan.png" alt="عزّنا بطبعنا" /><blockquote>«{displayMessage}»</blockquote><cite>— {displayName}</cite></div><div className="memory-foot">كلية الصيدلة · جامعة نجران</div></div><button className="download" type="button" onClick={downloadCard} disabled={downloading}>{downloading ? "جارٍ تجهيز البطاقة…" : "حفظ البطاقة على جهازك"}</button></div>
        </div>
          <div className="wall"><div className="wall-heading"><div><h3>جدار البصمات</h3><p className="wall-note">كل بصمة تُحفظ هنا وتظهر لجميع زوار الموقع.</p></div><span className="live-badge">جدار عام</span></div>{wallError && <p className="wall-error" role="alert">{wallError}</p>}{wallLoading ? <div className="wall-empty">جارٍ تحميل البصمات…</div> : memories.length === 0 ? <div className="wall-empty">كُن أول من يترك بصمته للوطن.</div> : <div className="wall-grid">{memories.map((memory) => <article className="wall-item" key={memory.id} style={{ borderColor: memory.color }}><span className="wall-trait">{memory.traitTitle}</span><p>{memory.message}</p><small>— {memory.name}</small></article>)}</div>}</div>
        </section>
      </main>

      <footer><p>نادي مداد الصيدلة · كلية الصيدلة · جامعة نجران</p><p className="developer-credit">Developed by Raghad Alfaifi</p></footer>
      <div className={`toast ${toast ? "show" : ""}`} role="status" aria-live="polite">{toast}</div>
    </>
  );
}

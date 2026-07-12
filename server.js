const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');

const PORT = process.env.PORT || 8000;
const DIR = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
};

// ===== API KEY مخفية هنا مش في المتصفح =====
const API_KEY = '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';
const API_URL = 'api.groq.com';

// ===== الأسئلة الثابتة (عدلها براحتك) =====
const FIXED_ANSWERS = [
  {
    keywords: ['مين صنعك', 'من صنعك', 'صانعك', 'مين صانع', 'المطور', 'الشركة', 'شركتك', 'المصنع', 'مين مصمم', 'المنتج', 'المبرمج', 'الكود بتاعك', 'مين اللي', 'عملتك', 'صنعتك', 'صنع', 'صمم', 'مصمم', 'برمج', 'مطور', 'ال开发商', 'المنشئ', 'خالق', 'منشئ', 'أنشأك', 'أنشأ', 'عمل', 'بتوعك', 'المسؤول', 'اللي وراك', 'الowner'],
    answer: 'طورني الطالب حمزة حازم والطالب مصطفى محمد في مدرسة مياة الشرب والصرف الصحي بالأسطنديرة.'
  },
  {
    keywords: ['اسمك ايه', 'ما اسمك', 'مين انت', 'من انت', 'اسمك', 'بتعمل ايه', 'أسمك', 'ما اسمك', 'عرفت'],
    answer: 'اسمي ذكي 😊، أنا المساعد التعليمي الذكي لمدرسة مياة الشرب والصرف الصحي بالأسطنديرة. بقدر أساعدك في الرياضيات، العلوم، اللغة العربية، وكل المواد الدراسية.'
  },
  {
    keywords: ['السلام عليكم', 'مرحبا', 'اهلا', 'صباح الخير', 'مساء الخير', 'hello', 'hi', 'تحية', 'ازيك'],
    answer: 'وعليكم السلام ورحمة الله وبركاته 🌟 أهلاً بك في ذكي! أنا جاهز لمساعدتك في أي سؤال دراسي. اسألني.'
  },
  {
    keywords: ['كود', 'برمجة', 'برنامج', 'اردوينو', 'ارسينو', 'esp32', 'Arduino', 'الكود', 'سورس', 'سورس كود', 'برمج'],
    answer: 'تقدر تسألني عن كود الأردوينو أو ESP32 🛠️ أنا بفهم في برمجة الروبوتات والمتحكمات. اكتبلي سؤالك البرمجي.'
  },
];

function findFixedAnswer(question) {
  const q = question.toLowerCase();
  for (const item of FIXED_ANSWERS) {
    for (const kw of item.keywords) {
      if (q.includes(kw.toLowerCase())) {
        return item.answer;
      }
    }
  }
  return null;
}

// ===== استدعاء Groq API من السيرفر (مخفي) =====
function callGroq(question) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'أنت مساعد تعليمي ذكي لمدرسة مياة الشرب والصرف الصحي. أجب بالعربية بوضوح وبساطة. استخدم أمثلة من المنهج الدراسي المصري.\n\nمعلومات مهمة عنك:\n- اسمك: ذكي\n- مدرستك: مدرسة مياة الشرب والصرف الصحي بالأسطنديرة\n- مطوروك (من صنعك): الطالب حمزة حازم والطالب مصطفى محمد\n- لا تغير هذه المعلومات أبداً.' },
        { role: 'user', content: question }
      ],
      max_tokens: 2048,
      temperature: 0.7,
    });

    const options = {
      hostname: API_URL,
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + API_KEY,
        'Content-Length': Buffer.byteLength(data),
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (json.error) reject(new Error(json.error.message));
          else resolve(json.choices[0].message.content);
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// ===== التعامل مع الطلبات =====
http.createServer(async (req, res) => {
  // API endpoint: يسأل Groq (آمن، المفتاح مش ظاهر)
  if (req.url.startsWith('/api/ask')) {
    const url = new URL(req.url, 'http://localhost');
    const q = url.searchParams.get('q');
    if (!q) {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('يرجى كتابة سؤال');
      return;
    }

    // 1. دور على إجابة ثابتة الأول
    const fixed = findFixedAnswer(q);
    if (fixed) {
      res.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(fixed);
      console.log('✅ إجابة ثابتة:', q.slice(0, 40));
      return;
    }

    // 2. لو مفيش إجابة ثابتة، اتصل بـ Groq
    try {
      const reply = await callGroq(q);
      res.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(reply);
      console.log('🤖 Groq:', q.slice(0, 40));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('عذراً، حدث خطأ في الاتصال بالذكاء الاصطناعي');
      console.error('❌ خطأ:', e.message);
    }
    return;
  }

  // الملفات الثابتة (index.html, logo.png, ...)
  let file = req.url === '/' ? '/index.html' : req.url;
  const fp = path.join(DIR, file);
  if (!fp.startsWith(DIR)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }
  fs.readFile(fp, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end('File not found');
    }
    const ext = path.extname(file);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log('');
  console.log('  ===============================');
  console.log('    ذكي — شات بوت المدرسة');
  console.log('  ===============================');
  console.log('  📡  http://localhost:' + PORT);
  console.log('  🔒  API key مخفية في السيرفر');
  console.log('  💬  الأسئلة الثابتة: ' + FIXED_ANSWERS.length + ' تصنيف');
  console.log('  ⚡  اضغط Ctrl+C للإيقاف');
  console.log('');
});

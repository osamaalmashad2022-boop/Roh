# الخطة الهندسية الشاملة لمراجعة وتطوير سلاسة وأداء اللعبة (Deep Engine Optimization & AAA Smoothness Plan)

استناداً إلى الفحص العميق لبنية الكود وأحدث الممارسات الهندسية المعتمدة في محركات الألعاب ثلاثية الأبعاد (Three.js 60 FPS Architecture & AAA Third-Person Game Feel)، تم تصميم هذه الخطة لرفع كفاءة المعالج والرسوميات، القضاء التام على التقطيع اللحظي (Zero-GC)، ومنح اللاعب إحساس تحكم وكاميرا فائق النعومة والاستجابة.

---

## 1. تطوير بنية المحرك والذاكرة (Spatial Hash Grid, Zero-GC & AI Tick Slicing)

### أ. شبكة التجزئة المكانية الفورية (`ArenaSpatialHashGrid` — $O(1)$ Proximity & Collision)
- **التحليل الهندسي**: حالياً يتم فحص تصادم المقذوفات (`64` مقذوفاً) وبحث الـ `99` مقاتلاً عن أقرب الخصوم عبر حلقات متداخلة $O(N^2)$، مما يستهلك وقت المعالج مع كثافة القتال.
- **التنفيذ في `src/game/engine.ts` و `src/components/ArenaCanvas.tsx`**:
  - بناء فئة `ArenaSpatialHashGrid` تقسم ساحة المعركة (`280m × 280m`) إلى خلايا مكانية بحجم `18m × 18m` باستخدام مصفوفات مسبقة التخصيص (`Pre-allocated Int32 Buckets`) بدون أي إنشاء لكائنات جديدة أثناء اللعب.
  - استخدام `spatialGrid.queryRadius(x, z, radius, scratchResults)` في:
    1. فحص تصادم المقذوفات ثلاثية الأبعاد (فحص المقاتلين داخل خلية المقذوف فقط بدلاً من المرور على 100 مقاتل).
    2. بحث الذكاء الاصطناعي عن أقرب خصم للاشتباك (`AI-vs-AI Skirmish`) في زمن $O(1)$.
    3. تحديد أهداف المهارات الانفجارية والـ Splash Damage.

### ب. القضاء التام على التخصيص المؤقت للذاكرة في حلقة الرسم (`Zero-GC Frame Loop`)
- **التحليل الهندسي**: يتم حالياً استدعاء `.filter().map()` وإنشاء مصفوفات جديدة في كل إطار أو كل 80 مللي ثانية (`nearCandidates`, `livingRivals`, `minimapActors`, `allContenders`)، وهو ما يحفز جامع القمامة (Garbage Collector) ويسبب تقطيعاً دقيقاً (Micro-stutters).
- **التنفيذ**:
  - استبدال كافة عمليات `.filter()` داخل حلقة `tick()` بمخازن ثابتة مسبقة التخصيص (`Pre-allocated Scratch Buffers`) يتم إعادة استخدامها بتصفير الطول (`length = 0`).
  - ضبط خاصية `THREE.DynamicDrawUsage` على كافة مصفوفات الـ `InstancedMesh` (`torsoInst`, `headInst`, `weaponInst`, `hpBarInst`, `particleMesh`) لتسريع نقل المصفوفات من المعالج (CPU) إلى البطاقة الرسومية (GPU).

### ج. الجدولة الذكية لتحديثات الذكاء الاصطناعي (`Distance-Based AI Tick Slicing`)
- **التنفيذ في `src/game/engine.ts`**:
  - تقسيم الـ `99` مقاتلاً إلى نطاقين ديناميكيين:
    - **النطاق القريب (`dist <= 58m`)**: تحديث كامل لتوجيه الذكاء الاصطناعي والفيزياء في كل إطار (`60Hz`).
    - **النطاق البعيد (`dist > 58m`)**: جدولة حسابات اتخاذ القرار (`computeStormAwareEnemyVelocity` والبحث عن الخصوم) بالتناوب على 3 دفعات (`Staggered 20Hz Slicing` حسب `rIdx % 3 === frameTick % 3`) مع استمرار تحريك الموقع بسلاسة في كل إطار (`60Hz Position Integration`)، مما يوفر أكثر من **55%** من حمل المعالج للذكاء الاصطناعي.

---

## 2. سلاسة الكاميرا واستجابة التحكم الاحترافية (AAA Camera, Input Buffering & Smooth Step-Up)

### أ. نظام الكاميرا الزنبركية المتكيفة والتأطير الاستباقي (`Spring-Damper Camera & Velocity Look-Ahead`)
- **التنفيذ في `src/game/engine.ts` (`computeSmoothThirdPersonCamera`) و `src/components/ArenaCanvas.tsx`**:
  - **استجابة فورية عند التصويب الدقيق (`Scoped / ADS Tight Tracking`)**: رفع معامل التخميد الزنبركي عند تفعيل المنظار أو شحن السلاح لضمان ثبات التصويب بنسبة 100% دون أي تأخر.
  - **التأطير الاستباقي أثناء الحركة (`Predictive Velocity Look-Ahead`)**: إزاحة نقطة تركيز الكاميرا بنعومة في اتجاه سرعة اللاعب (`vx, vz`) أثناء الجري أو ركوب المطية (`[V]`) لمنح اللاعب رؤية أوسع للمسار أمامه.
  - **تنعيم مسافة تصادم الكاميرا مع الأعمدة (`Smooth Occlusion Distance Damping`)**: بدلاً من القفز المفاجئ للكاميرا عند مرور عمود خلف اللاعب، يتم تخميد المسافة (`smoothedCamDist`) تدريجياً بسرعة استجابة عالية عند الاقتراب وسرعة انسيابية عند الابتعاد.

### ب. التخزين المؤقت للمدخلات (`Combat Input Queue / Action Buffering — 160ms Window`)
- **التنفيذ في `src/game/engine.ts` و `src/components/ArenaCanvas.tsx`**:
  - إضافة مخزن أوامر ذكي (`bufferedAction: { type: 'ability' | 'dash' | 'fire' | 'swap'; slot?: ...; expiresAt: number }`) يحتفظ بضغطة اللاعب لمدة `160ms` إذا ضغط على مهارة `[Q/E/C/R]` أو الاندفاع `[Shift]` أو الإطلاق قبل انتهاء فترة التبريد أو الاندفاع بجزء من الثانية، وينفذها تلقائياً في اللحظة الأولى لجاهزيتها دون ضياع أي ضغطة.

### ج. التسلق السلس للحواف وتنعيم انتقال الارتفاع (`Smooth Step-Up & Terrain Elevation Damping`)
- **التنفيذ**:
  - فصل الارتفاع الفيزيائي اللحظي عن ارتفاع العرض البصري (`visualY`) عبر دالة تخميد سريعة (`THREE.MathUtils.damp`) بحيث يصعد البطل فوق المنصات والدرجات الحجرية والتضاريس بانسيابية طبيعية دون أي قفزة بصرية حادة (Zero Vertical Snapping).

---

## 3. الضبط التلقائي للجودة ومؤشرات الفحص الآلي (Adaptive Quality Scaler & Performance Benchmarks)

### أ. الموازنة التلقائية للدقة والمؤثرات (`Adaptive Dynamic Resolution & VFX Scaler`)
- **التنفيذ في `src/game/engine.ts` (`computeAdaptiveQualityState`)**:
  - مراقبة زمن الإطار الفعلي (`smoothedFrameTimeMs`) ومستوى استقرار الإطارات (`Frame Pacing Stability %`).
  - ضبط كثافة الجسيمات الثانوية ودقة الرندر (`pixelRatio` بين `0.75` و `1.5` في بيئات GPU الحقيقية) تلقائياً عند اشتداد الانفجارات الجماعية لضمان عدم هبوط الأداء عن 60 إطاراً في الثانية.

### ب. توسيع لوحة الفحص اللحظي `[F3]` (`Engine Self-Diagnostics Overlay`)
- **التنفيذ في `src/components/GameHUD.tsx`**:
  - عرض مؤشرات السلاسة الجديدة في لوحة `[F3]`:
    - **كفاءة الشبكة المكانية (`Spatial Grid Cells / Queries`)**.
    - **مؤشر استقرار الإطارات (`Frame Stability %` & `Dynamic Quality Scale`)**.
    - **حالة جدولة الذكاء الاصطناعي (`AI Tick Slice 60Hz/20Hz`)**.

### ج. اختبارات الأداء والانحدار الآلية (`Automated Performance & Smoothness Tests`)
- **التنفيذ في `src/game/rules.test.ts`**:
  - إضافة اختبارات آلية تتحقق من دقة وسرعة `ArenaSpatialHashGrid`، صحة حسابات الكاميرا الزنبركية `computeSmoothThirdPersonCamera`، عمل نظام `InputBufferQueue`، وكفاءة `computeAdaptiveQualityState`.

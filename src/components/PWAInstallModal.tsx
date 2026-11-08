import React, { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

    try {
      setIsInIframe(window.self !== window.top);
    } catch {
      setIsInIframe(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    isInIframe,
    install,
  };
}

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, isInIframe, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [zipDone, setZipDone] = useState(false);
  const [launcherDone, setLauncherDone] = useState(false);

  if (isInstalled) {
    return (
      <div
        data-testid="pwa-installed-badge"
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/20 border border-emerald-400/60 text-emerald-200 text-xs font-mono-num"
      >
        <span>✓</span>
        <span>مثبتة على الحاسوب · Desktop App Active</span>
      </div>
    );
  }

  const handlePrimaryClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) {
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const copyAppLink = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2200);
    } catch {
      // ignore clipboard errors in restricted contexts
    }
  };

  const copyLocalCommands = async () => {
    try {
      await navigator.clipboard.writeText('npm install && npm run dev');
      setCopiedCmd(true);
      setTimeout(() => setCopiedCmd(false), 2200);
    } catch {
      // ignore
    }
  };

  const handleDownloadZip = async () => {
    try {
      setDownloadingZip(true);
      const res = await fetch('/api/download/project-zip');
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Khepri-Outriders-of-the-Sun-PC.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      setZipDone(true);
      setTimeout(() => setZipDone(false), 4000);
    } catch {
      // Fallback to direct anchor navigation
      const a = document.createElement('a');
      a.href = '/api/download/project-zip';
      a.download = 'Khepri-Outriders-of-the-Sun-PC.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      setDownloadingZip(false);
    }
  };

  const handleDownloadWindowsLauncher = async () => {
    try {
      const res = await fetch('/api/download/windows-launcher');
      if (!res.ok) throw new Error('Launcher failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Play-Khepri-Desktop.bat';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      setLauncherDone(true);
      setTimeout(() => setLauncherDone(false), 4000);
    } catch {
      const a = document.createElement('a');
      a.href = '/api/download/windows-launcher';
      a.download = 'Play-Khepri-Desktop.bat';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const [installerDone, setInstallerDone] = useState(false);

  const handleDownloadPcInstaller = async () => {
    try {
      const res = await fetch('/api/download/pc-installer');
      if (!res.ok) throw new Error('Installer failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'INSTALL_GAME_PC.bat';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      setInstallerDone(true);
      setTimeout(() => setInstallerDone(false), 4000);
    } catch {
      const a = document.createElement('a');
      a.href = '/api/download/pc-installer';
      a.download = 'INSTALL_GAME_PC.bat';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <>
      <button
        type="button"
        data-testid="pwa-install-button"
        onClick={handlePrimaryClick}
        className={
          compact
            ? 'px-3 py-2 rounded-lg bg-sky-500/25 hover:bg-sky-500/35 border border-sky-400/70 text-sky-200 font-display font-bold text-xs tracking-wider transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5'
            : 'px-4 py-3 rounded-lg bg-sky-500/25 hover:bg-sky-500/35 border border-sky-400/75 text-sky-100 font-display font-bold text-xs md:text-sm tracking-wider transition-colors shadow-md cursor-pointer whitespace-nowrap flex items-center gap-2'
        }
      >
        <svg className="w-4 h-4 text-sky-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.2"
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        <span>تحميل وتثبيت على الحاسوب · Download PC App</span>
      </button>

      {showModal && (
        <div
          data-testid="pwa-install-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 pointer-events-auto overflow-y-auto"
        >
          <div className="w-full max-w-2xl rounded-2xl bg-[#140e09] border-2 border-amber-500/60 p-5 md:p-6 text-amber-100 shadow-2xl my-auto">
            <div className="flex items-center justify-between border-b border-amber-500/25 pb-3 mb-4">
              <div>
                <div className="text-[11px] font-mono-num uppercase tracking-widest text-sky-300">
                  DIRECT PC INSTALLER &amp; DESKTOP LAUNCHER · مثبت اللعبة الرسمي على الحاسوب
                </div>
                <h2 className="font-display text-lg md:text-xl font-bold text-amber-200 mt-0.5">
                  ملفات تثبيت وتشغيل Khepri: Outriders of the Sun على الكمبيوتر
                </h2>
              </div>
              <button
                type="button"
                data-testid="pwa-modal-close"
                onClick={() => setShowModal(false)}
                className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 text-xs font-mono-num cursor-pointer"
              >
                ✕ إغلاق
              </button>
            </div>

            <div className="space-y-3.5 text-xs md:text-sm leading-relaxed">
              {/* Method 1: Direct 1-Click File Download (ZIP + PC Installer + Desktop Launcher) */}
              <div className="p-3.5 rounded-xl bg-[#1c130c] border-2 border-emerald-400/50">
                <div className="font-bold text-emerald-300 mb-1 flex items-center justify-between">
                  <span>1. ملف التثبيت الرسمي في ملفات اللعبة (INSTALL_GAME_PC.bat + .ZIP)</span>
                  <span className="text-[10px] font-mono-num px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-200">
                    متوفر في مجلد اللعبة
                  </span>
                </div>
                <p className="text-xs text-amber-100/85 mb-2.5">
                  تمت إضافة ملفات التثبيت الرسمية مباشرة في مجلد اللعبة الرئيسي:{' '}
                  <code className="text-emerald-300 font-mono-num">INSTALL_GAME_PC.bat</code> (لتثبيت اللعبة وإنشاء
                  أيقونة على سطح المكتب وقائمة ابدأ) و{' '}
                  <code className="text-emerald-300 font-mono-num">START_GAME_WINDOWS.bat</code> و{' '}
                  <code className="text-emerald-300 font-mono-num">Install-Khepri-PC.ps1</code>:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    data-testid="download-project-zip-btn"
                    onClick={handleDownloadZip}
                    disabled={downloadingZip}
                    className="py-2.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-stone-950 font-bold text-xs tracking-wide transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <span>⬇</span>
                    <span>
                      {downloadingZip
                        ? 'جاري تجهيز ZIP...'
                        : zipDone
                          ? '✓ تم بدء التحميل!'
                          : 'تحميل اللعبة + المثبت (.ZIP)'}
                    </span>
                  </button>
                  <button
                    type="button"
                    data-testid="download-pc-installer-btn"
                    onClick={handleDownloadPcInstaller}
                    className="py-2.5 px-3 rounded-lg bg-amber-500/25 hover:bg-amber-500/40 border border-amber-400/70 text-amber-100 font-bold text-xs tracking-wide transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>🛠</span>
                    <span>
                      {installerDone ? '✓ تم تحميل المثبت!' : 'ملف التثبيت (INSTALL_GAME_PC.bat)'}
                    </span>
                  </button>
                  <button
                    type="button"
                    data-testid="download-windows-launcher-btn"
                    onClick={handleDownloadWindowsLauncher}
                    className="py-2.5 px-3 rounded-lg bg-sky-500/25 hover:bg-sky-500/40 border border-sky-400/70 text-sky-100 font-bold text-xs tracking-wide transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>⚡</span>
                    <span>
                      {launcherDone ? '✓ تم تحميل المشغل!' : 'مشغل فوري (Play-Desktop.bat)'}
                    </span>
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-amber-200/75 font-mono-num">
                  <span>بعد فك الضغط، اضغط مرتين على INSTALL_GAME_PC.bat لإنشاء اختصار سطح المكتب وتشغيل اللعبة.</span>
                  <button
                    type="button"
                    data-testid="pwa-copy-cmd"
                    onClick={copyLocalCommands}
                    className="underline text-amber-300 hover:text-amber-200 cursor-pointer"
                  >
                    {copiedCmd ? '✓ تم نسخ npm install && npm run dev' : 'نسخ أمر التشغيل اليدوي'}
                  </button>
                </div>
              </div>

              {/* Method 2: GitHub Sync & AI Studio Top Toolbar Download */}
              <div className="p-3.5 rounded-xl bg-[#1c130c] border border-amber-400/45">
                <div className="font-bold text-amber-300 mb-1 flex items-center justify-between">
                  <span>2. التحميل عبر ربط GitHub أو زر التحميل في الشريط العلوي</span>
                  <span className="text-[10px] font-mono-num px-2 py-0.5 rounded bg-amber-500/20 text-amber-200">
                    GitHub &amp; ZIP
                  </span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-xs text-amber-100/90">
                  <li>
                    <strong>نعم! إذا قمت بربط GitHub:</strong> اضغط على <strong>أيقونة GitHub</strong> في الشريط العلوي
                    الأيمن لمنصة AI Studio لحفظ المشروع في حسابك على GitHub، ومن هناك يمكنك الضغط على{' '}
                    <strong>Code &rarr; Download ZIP</strong> أو استنساخه عبر <code className="text-emerald-300">git clone</code>.
                  </li>
                  <li>
                    كما يمكنك الضغط مباشرة على <strong>أيقونة التنزيل (Download App)</strong> الموجودة بجانب أيقونة
                    GitHub في أعلى يمين الشاشة لتنزيل مجلد اللعبة كاملاً.
                  </li>
                </ul>
              </div>

              {/* Method 3: Standalone Desktop PWA App */}
              <div className="p-3.5 rounded-xl bg-[#1c130c] border border-sky-400/40">
                <div className="font-bold text-sky-300 mb-1 flex items-center justify-between">
                  <span>3. التثبيت الفوري كتطبيق سطح مكتب مستقل (PWA بدون Node.js)</span>
                  <span className="text-[10px] font-mono-num px-2 py-0.5 rounded bg-sky-500/20 text-sky-200">
                    Windows / Mac / Mobile
                  </span>
                </div>
                {isInstallable ? (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={install}
                      className="w-full py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-stone-950 font-bold text-xs uppercase tracking-wider transition cursor-pointer"
                    >
                      ⬇ اضغط هنا لتثبيت التطبيق الآن (Install Desktop App Now)
                    </button>
                  </div>
                ) : isIOS ? (
                  <p className="text-amber-100/85 text-xs">
                    على أجهزة iPhone / iPad: اضغط زر <strong>مشاركة (Share)</strong> في متصفح Safari ثم اختر{' '}
                    <strong>الإضافة إلى الشاشة الرئيسية (Add to Home Screen)</strong>.
                  </p>
                ) : (
                  <div className="space-y-2 text-xs text-amber-100/85">
                    {isInIframe && (
                      <p className="text-amber-200/90">
                        للتثبيت المباشر من المتصفح بدون تحميل كود: انسخ الرابط بالأسفل وافتحه في تبويب جديد في{' '}
                        <strong>Chrome</strong> أو <strong>Edge</strong>، ثم اضغط أيقونة <strong>تثبيت التطبيق</strong>{' '}
                        في يمين شريط العنوان:
                      </p>
                    )}
                    <div className="flex items-center gap-2 pt-0.5">
                      <input
                        type="text"
                        readOnly
                        value={appUrl}
                        aria-label="Direct Game URL"
                        className="flex-1 px-2.5 py-1.5 rounded bg-black/50 border border-amber-500/30 text-amber-200 font-mono-num text-[11px]"
                      />
                      <button
                        type="button"
                        data-testid="pwa-copy-link"
                        onClick={copyAppLink}
                        className="px-3 py-1.5 rounded bg-sky-500/25 hover:bg-sky-500/40 border border-sky-400/60 text-sky-200 font-mono-num text-xs cursor-pointer whitespace-nowrap"
                      >
                        {copiedUrl ? '✓ تم النسخ!' : 'نسخ رابط اللعبة'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-display font-bold text-xs uppercase tracking-wider cursor-pointer"
              >
                حسناً · العودة للعبة
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};


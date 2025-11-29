/**
 * CROSSFADE & FADE SLIDER FIX - Verbindet Slider mit Sekundenzahlen
 * @version 1.0.0
 */
'use strict';

document.addEventListener('DOMContentLoaded', function () {
    console.log('🎚️ Crossfade Slider Fix geladen');

    // Crossfade Dauer Slider
    const crossfadeSlider = document.getElementById('crossfadeDuration');
    const crossfadeValue = document.getElementById('crossfadeValue');

    if (crossfadeSlider && crossfadeValue) {
        crossfadeSlider.addEventListener('input', function () {
            const seconds = parseFloat(this.value).toFixed(1);
            crossfadeValue.textContent = seconds + 's';

            // Speichere Wert
            localStorage.setItem('crossfade-duration', seconds);

            // Aktualisiere CrossfadeController falls vorhanden
            if (window.CrossfadeController) {
                window.CrossfadeController.setDuration(parseFloat(seconds) * 1000);
            }
        });

        // Initialer Wert
        const saved = localStorage.getItem('crossfade-duration');
        if (saved) {
            crossfadeSlider.value = saved;
            crossfadeValue.textContent = parseFloat(saved).toFixed(1) + 's';
        }
    }

    // Fade-In Dauer Slider
    const fadeInSlider = document.getElementById('fadeInDuration');
    const fadeInValue = document.getElementById('fadeInValue');

    if (fadeInSlider && fadeInValue) {
        fadeInSlider.addEventListener('input', function () {
            const seconds = parseFloat(this.value).toFixed(1);
            fadeInValue.textContent = seconds + 's';
            localStorage.setItem('fadein-duration', seconds);
        });

        const savedFadeIn = localStorage.getItem('fadein-duration');
        if (savedFadeIn) {
            fadeInSlider.value = savedFadeIn;
            fadeInValue.textContent = parseFloat(savedFadeIn).toFixed(1) + 's';
        }
    }

    // Fade-Out Dauer Slider
    const fadeOutSlider = document.getElementById('fadeOutDuration');
    const fadeOutValue = document.getElementById('fadeOutValue');

    if (fadeOutSlider && fadeOutValue) {
        fadeOutSlider.addEventListener('input', function () {
            const seconds = parseFloat(this.value).toFixed(1);
            fadeOutValue.textContent = seconds + 's';
            localStorage.setItem('fadeout-duration', seconds);
        });

        const savedFadeOut = localStorage.getItem('fadeout-duration');
        if (savedFadeOut) {
            fadeOutSlider.value = savedFadeOut;
            fadeOutValue.textContent = parseFloat(savedFadeOut).toFixed(1) + 's';
        }
    }

    // Überblend-Typ Handler
    const crossfadeType = document.getElementById('crossfadeType');
    if (crossfadeType) {
        crossfadeType.addEventListener('change', function () {
            const type = this.value;
            localStorage.setItem('crossfade-type', type);
            console.log('✅ Crossfade-Typ:', type);

            if (window.CrossfadeController) {
                window.CrossfadeController.setType(type);
            }
        });

        const savedType = localStorage.getItem('crossfade-type');
        if (savedType) {
            crossfadeType.value = savedType;
        }
    }

    // Fade-Kurve Handler
    const fadeCurve = document.getElementById('fadeCurve');
    if (fadeCurve) {
        fadeCurve.addEventListener('change', function () {
            const curve = this.value;
            localStorage.setItem('fade-curve', curve);
            console.log('✅ Fade-Kurve:', curve);
        });

        const savedCurve = localStorage.getItem('fade-curve');
        if (savedCurve) {
            fadeCurve.value = savedCurve;
        }
    }

    console.log('✅ Crossfade Slider Fix aktiv');
});

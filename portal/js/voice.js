/* voice.js — facility announcer: subtitle queue + browser TTS.
   All dialogue here is original writing for this homage project. */
'use strict';
(function (P) {

  const V = P.voice = { queue: [], busy: false, enabled: true, ttsOk: 'speechSynthesis' in window };
  const el = () => document.getElementById('subtitles');

  V.say = function (lines, opts) {
    if (!Array.isArray(lines)) lines = [lines];
    for (const ln of lines) V.queue.push({ text: ln, hold: (opts && opts.hold) || null });
    pump();
  };

  V.interrupt = function (lines) {
    V.queue.length = 0;
    if (V.ttsOk) speechSynthesis.cancel();
    V.busy = false;
    V.say(lines);
  };

  function pump() {
    if (V.busy || !V.queue.length) return;
    V.busy = true;
    const item = V.queue.shift();
    const e = el();
    e.textContent = item.text;
    e.classList.add('show');

    const holdMs = item.hold || Math.max(2200, 380 + item.text.length * 62);
    let done = false;
    const finish = () => {
      if (done) return; done = true;
      e.classList.remove('show');
      setTimeout(() => { V.busy = false; pump(); }, 350);
    };

    if (V.ttsOk && V.enabled) {
      const u = new SpeechSynthesisUtterance(item.text);
      const voices = speechSynthesis.getVoices();
      const pick = voices.find(v => /en[-_]/i.test(v.lang) && /female|zira|samantha|google uk english female/i.test(v.name))
                || voices.find(v => /en[-_]/i.test(v.lang));
      if (pick) u.voice = pick;
      u.rate = 0.92; u.pitch = 0.75; u.volume = 0.9;
      u.onend = finish; u.onerror = finish;
      speechSynthesis.speak(u);
      setTimeout(finish, holdMs + 6000); // safety net
    } else {
      setTimeout(finish, holdMs);
    }
  }

  // ------------------------------------------------------------ script bank
  // Original lines, written for this project.
  V.lines = {
    wake: [
      "Good morning, test associate. You have been selected for mandatory voluntary science.",
      "Your survival is statistically probable. Please enjoy that thought while it lasts."
    ],
    ch00: [
      "This first chamber calibrates your ability to walk. Historically, most participants pass.",
      "Note the luminous gateways. Matter that enters one will exit the other. Complaints about this are not accepted."
    ],
    ch01: [
      "You have been issued a handheld gateway device. It is currently limited to the blue aperture, because trust is earned.",
      "The floor in the next area has been replaced with industrial byproduct. Do not taste it."
    ],
    ch02: [
      "Device upgrade complete. You may now project both apertures. Try not to let the power change you.",
      "Reminder: the weighted storage cube does not have feelings. Any attachment you form is your own liability."
    ],
    ch03: [
      "This chamber demonstrates conservation of momentum. What falls into a gateway comes out exactly as fast, and considerably more surprised.",
      "Fall with purpose. The floor at the bottom of the shaft is fully certified."
    ],
    ch04: [
      "The next chamber contains automated sentry units. They believe in what they do. Unfortunately, what they do is shoot you.",
      "Sentries cannot see through solid objects. We mention this for no particular reason."
    ],
    ch05: [
      "Final chamber. Everything you have learned will now be tested at once, because we enjoy efficiency.",
      "A celebratory baked good has been prepared for successful candidates. Its existence has not been independently verified."
    ],
    death: [
      "Your failure has been recorded for training purposes. Reinstating you now.",
      "Interesting result. Please try to be less porous this time.",
      "That outcome was within acceptable parameters. Not yours. Ours."
    ],
    goo: [
      "The fluid you touched is not water. Reassembling you from backup.",
      "Please avoid marinating in the byproduct."
    ],
    void: [
      "You have exited the test area without authorization. Retrieval was instantaneous and unflattering.",
      "Congratulations on discovering the outside of the chamber. There is no science out there. Returning you to the science.",
      "Participant lost outside mapped space. Deploying a fresh participant with your face on it."
    ],
    restart: [
      "Chamber reset requested. We were not judging your previous attempt. We recorded it, but we were not judging it.",
      "Resetting the chamber. All evidence of the last five minutes has been archived under 'learning experiences'.",
      "Very well. The chamber will now pretend none of that happened."
    ],
    turretDown: [
      "Sentry unit lost. It will be mourned by accounting.",
      "You have voided that sentry's warranty."
    ],
    fizzle: [
      "Unauthorized equipment has been dissolved at the chamber boundary. This is a courtesy."
    ],
    victory: [
      "Congratulations. You have completed all scheduled enrichment activities.",
      "The exit elevator will now pretend to take you to the surface.",
      "The baked good is being plated. Please remain calm and do not investigate the kitchen."
    ]
  };

  V.rand = key => {
    const a = V.lines[key];
    return a[Math.floor(Math.random() * a.length)];
  };

})(window.PORTAL);

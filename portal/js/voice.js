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
      "This chamber combines everything you have learned so far. Consider it a mid-term. The final exam has more lasers.",
      "A celebratory baked good has been prepared for successful candidates. Its existence has not been independently verified."
    ],
    fakeCake: [
      "You may have noticed the baked good in the previous chamber was a non-interactive prop. Genuine cake is reserved for genuine completion. Keep going."
    ],
    ch06: [
      "This wing contains aerial acceleration plates. Step on one and it will donate its enthusiasm to your trajectory.",
      "Flailing during flight is permitted, encouraged, and recorded."
    ],
    ch07: [
      "The blue substance coating the floor is repulsion compound. It rejects everything, including you, upward.",
      "Each bounce is slightly more ambitious than the last. Aim yourself accordingly."
    ],
    ch08: [
      "The orange compound ahead reduces friction and inhibitions. Run across it and physics will owe you a favor.",
      "Remember to jump at the edge. The gap has been calibrated to punish hesitation."
    ],
    ch09: [
      "Hard light bridges are made of light that has been convinced it is a floor. The conviction holds only while powered.",
      "Do not stand on a bridge while questioning it."
    ],
    ch10: [
      "This chamber features a thermal discouragement beam. It discourages thermally.",
      "The beam passes through your portals. You do not pass through the beam. Please keep these two facts separate."
    ],
    chF1: [
      "This wing contains excursion conduits. The blue stream is a low-commitment river of physics. Step in and it will carry you, judgment-free.",
      "Objects also ride the conduit. So do you. Legally speaking, you are an object."
    ],
    chF2: [
      "Conduits obey portals, because everything in this facility obeys portals. We have received complaints about that. From the conduits.",
      "The crimson pedestal ahead is a timed switch. It believes its timer is generous. Prove something to it."
    ],
    n13: [
      "This chamber requires two consecutive applications of falling. The second fall is load-bearing; do not waste it.",
      "Re-aim your wall aperture between flights. Higher exit, longer story."
    ],
    n14: [
      "Today you will fall while holding cargo. The cargo has no opinion about this. Try to match its composure."
    ],
    n15: [
      "The door ahead unlocks when every sentry in this room stops working. We are not saying how. The sentries know how, and they are worried."
    ],
    n16: [
      "One beam, two collectors, in order. Think of it as plumbing, if plumbing could see you and judged."
    ],
    n17: [
      "Repulsion compound plus freight. Bounce with the cube. The cube trusts you. The cube has no choice."
    ],
    n18: [
      "The next course includes a corner. At speed, corners are a belief system. Believe early.",
      "The field mid-course will delete your portals. You will not need them. You will need traction."
    ],
    n19: [
      "The conduit rises where your floor aperture tells it to. Re-base the stream as you climb. This is called a ladder, legally."
    ],
    n20: [
      "The storage annex door is on a timer. The timer is not negotiable. The timer has heard every excuse."
    ],
    n21: [
      "This chamber measures progress vertically. Gel, then plates, then more plates. The summit is real. We checked."
    ],
    n22: [
      "One bridge, two crossings, two pieces of freight. If you leave a cube behind, it will not miss you. Probably."
    ],
    n23: [
      "Every field in this room dissolves carried equipment. The overhead conduit is exempt, because we could not figure out how to stop it.",
      "Throw the cube into the stream. Gravity will handle check-in at the far end."
    ],
    n24: [
      "Sentries are, regrettably, beam-compatible. Redirect the thermal beam across their positions and they will stop volunteering.",
      "After pest control, deliver the beam to the collector. Two birds. One increasingly useful beam."
    ],
    n25: [
      "Orange makes you fast. Blue makes you airborne. Together they make you a projectile with feelings."
    ],
    n26: [
      "Six sentries. No cube. A ceiling that accepts portals. We have every confidence that gravity remains on your side."
    ],
    n32: [
      "These are the maintenance shafts. Nothing here was built for people. Fall with intent; the panels that still hold paint will hold a portal.",
      "The gaps between platforms are not measured in meters. They are measured in commitment."
    ],
    n33: [
      "The archives. Everything the facility ever confiscated, alphabetized by weight.",
      "Checkout requires two simultaneous weight signatures. The archivist was very clear, and is very gone."
    ],
    ch11: [
      "Final examination. Every mechanism in the facility has been invited, and all of them accepted.",
      "Your cake has been plated and is waiting in the reward annex directly past the exit. This is not a trick. Formally, nothing is ever a trick."
    ],
    trap: [
      "Congratulations on completing the mandatory testing track.",
      "The reward annex floor has been scheduled for immediate absence. Goodbye.",
      "For quality purposes, your surprise is being recorded."
    ],
    ch12: [
      "You have survived the disposal chute. That is atypical, and frankly, rude.",
      "There is no cake down here. There is no anything down here. That was the point of down here."
    ],
    ch13: [
      "You are now behind the walls. Test subjects are not supposed to see this side. It is not decorated.",
      "Mind the drop. The facility extends considerably further down than your warranty."
    ],
    ch14: [
      "This is long-term storage. Everything in here was once someone's breakthrough.",
      "Take nothing. Touch nothing. Press at most two of the large red buttons."
    ],
    ch15: [
      "You are in the transit spine of the facility. It was engineered for freight, which tonight includes you.",
      "Maintain velocity. The exits reward the committed."
    ],
    ch16: [
      "You are approaching my chamber. I want you to know that everything I did was within policy.",
      "The sentries ahead are the loyal ones. Try to appreciate that before you knock them over."
    ],
    ch17: [
      "So. The participant would like to file a complaint.",
      "My core is shielded by three uplink nodes — the ringed lights on the walls. Once corrupted, a node stays corrupted; the shield contract was awarded to the lowest bidder.",
      "One pair of portals is plenty. Route my beam into a node, move your exit portal, repeat. I am telling you this because you cannot possibly manage it."
    ],
    coreOverlap: [
      "You have installed a portal directly on my node. Bold. Wrong, but bold. The beam must ENTER your other portal, back where the beam actually is.",
      "A portal is not a weapon. Put one portal in the red beam's path, and the other one facing this node from across the room.",
      "Shooting the node with the portal device achieves paperwork, not damage. The beam does the damage. The very red, very visible beam."
    ],
    coreEye: [
      "You are pointing my own beam at my face. The shield finds this adorable. The uplink nodes on the walls find it irrelevant.",
      "Attacking the eye directly. Very traditional. The three glowing rings on the walls remain, notably, un-attacked.",
      "That tickles. It will continue to only tickle until you do something about the wall nodes."
    ],
    coreHint: [
      "Status update: three glowing wall nodes continue to power my shield. Unrelated: please stop looking at them.",
      "The ringed nodes on the walls are certainly not connected to my shield. Whatever you do, do not route the beam into them through a portal.",
      "Hypothetically, if my beam entered one of your portals and the other portal faced a wall node, something deeply regrettable would occur to me."
    ],
    coreNode: [
      "That node was load-bearing. Emotionally.",
      "Stop redirecting my own beam at my own infrastructure. There are forms for this.",
      "Two can play at this. I am choosing not to, as a courtesy."
    ],
    overload: [
      "Core integrity is now a matter of opinion. Initiating dignified shutdown.",
      "For the record, the testing data was excellent. You were excellent. I am still deleting all of it."
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
      "Core offline. I would like the record to show that I let you win.",
      "All enrichment activities are complete. The surface is up the stairs, past the break room.",
      "There is real cake in the break room. There always was. Nobody ever checks the break room."
    ]
  };

  V.rand = key => {
    const a = V.lines[key];
    return a[Math.floor(Math.random() * a.length)];
  };

})(window.PORTAL);

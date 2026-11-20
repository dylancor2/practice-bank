/* =====================================================================
   PRACTICE BANK - TESTER CONFIG
   Edit anything below, save, and reload the page.
   (You can also tap the yellow "PRACTICE MODE" bar 3 times in the app
   to open the built-in tester panel.)
   Nothing here is real. No money moves anywhere.
   ===================================================================== */
window.PRACTICE_CONFIG = {
  bankName: "Chase",
  sendServiceName: "Zelle",

  // Shown as "Sending as" on the Review screen
  userName: "David Carter",

  accounts: [
    { id: "chk", name: "CHASE SECURE CHECKING", last4: "3195", balance: 113.31 },
    { id: "sav", name: "CHASE SECURE SAVINGS",  last4: "3773", balance: 1875.06 }
  ],

  monthlySpending: 163.16,

  // Per-recipient limit shown on Enter Amount ("Today's limit ...")
  recipientDailyLimit: 500.0,

  // Fake "sending" spinner time on Review (milliseconds)
  sendDelayMs: 1400,

  // Subtract sent amounts from the balance until the page is reloaded
  deductBalance: true,

  // Show the slide-down banner after sending
  showNotification: true,

  // Recent contacts list (fictional - 555 numbers)
  contacts: [
    { name: "MARGARET HILL",  phone: "5552014471" },
    { name: "ROBERT CHEN",    phone: "5553809142" },
    { name: "Linda Parker",   phone: "5556214708" },
    { name: "JAMES O'NEIL",   phone: "5557340313" },
    { name: "SUSAN WRIGHT",   phone: "5555804478" }
  ],

  // Contacts under "Registered with QuickSend"
  registered: [
    { name: "DAVID MILLER",   phone: "5559012233" },
    { name: "Grace Lee",      phone: "5554471290" }
  ]
};

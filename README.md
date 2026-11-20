# Practice Bank

A pretend mobile banking app for practice and testing. It is not a real bank, it never connects to a server, and no money ever moves.

## What works
- **Home / Accounts**: shows the balances. Every other button shows a "Not available in practice mode" message.
- **Send**: opens Select Recipient, with recent contacts, a search bar, Enter Amount, Review, the "Sending..." spinner, and the Confirmation screen ("(number) received your money."). Tapping **Done** takes you back to Home.
- **Search**: type a name, or a 10-digit mobile number, then tap the "Send to this number" row or press Enter/Go.
- **Errors**: shows a warning for no amount, an amount over the daily limit, or an amount over the account balance.
- **Balance**: drops after a send. Reloading the page resets it.

## Tester settings
- Tap the yellow **PRACTICE MODE** bar **3 times** to change your name, balances, monthly spending, and limit, or to turn the balance drop and the notification on or off. Changes are saved on that device only.
- Change contacts and everything else in `config.js`.

## Put it on a phone's home screen
The app has to be on a web address (https). The easiest free options:
1. **Netlify Drop**: go to https://app.netlify.com/drop and drag the whole `practice-bank` folder onto the page. You get a link right away.
2. **GitHub Pages**: upload the folder to a GitHub repository and turn on Pages.

Then, on the phone:
- **iPhone (Safari)**: open the link, tap Share, then **Add to Home Screen**.
- **Android (Chrome)**: open the link, tap ⋮, then **Add to Home screen** (or **Install app**).

Opened from its icon, it runs full-screen like an app and works offline after the first visit.

## Run it on your computer
Any static file server works. From inside this folder, for example:
`python -m http.server 8000`, then open http://localhost:8000

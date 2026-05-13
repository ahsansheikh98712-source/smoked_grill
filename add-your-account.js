const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const { createId } = require("@paralleldrive/cuid2");

async function addYourAccount() {
  const usersFile = path.join(process.cwd(), "users.json");

  // Read existing users
  let users = [];
  if (fs.existsSync(usersFile)) {
    const data = fs.readFileSync(usersFile, "utf8");
    users = JSON.parse(data);
  }

  // Add account
  const yourAccount = {
    id: createId(),
    email: "quemunity.service@gmail.com",
    username: "quemunity",
    password: await bcrypt.hash("Bears1022!", 12),
    firstName: "Que",
    lastName: "Munity",
    createdAt: new Date().toISOString(),
  };

  // Check if already exists
  const existing = users.find((u) => u.email === yourAccount.email);
  if (existing) {
    console.log("🔄 Updating existing account...");
    const index = users.findIndex((u) => u.email === yourAccount.email);
    users[index] = yourAccount;
  } else {
    console.log("➕ Adding new account...");
    users.push(yourAccount);
  }

  // Write to file
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

  console.log("✅ Your account is ready!");
  console.log("📧 Email: quemunity.service@gmail.com");
  console.log("🔑 Password: Bears1022!");
  console.log("\nTry signing in now!");
}

addYourAccount().catch(console.error);

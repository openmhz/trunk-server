/**
 * One-off migration for the callsign / split-location fields.
 *
 *   docker exec hamrecorder-account-1 node /app/scripts/migrate-callsign-location.js
 *
 * Two changes per user:
 *
 *   callsign  <- screenName. On this site screenName was already being used as
 *               a callsign, and the model now derives screenName from callsign
 *               rather than the other way round.
 *   location  -> city / state. Split on the last comma, which covers the
 *               "City, ST" shape the field was actually used for. Anything that
 *               does not split lands wholly in city.
 *
 * Country is deliberately left empty: it cannot be inferred from a free-text
 * location without guessing, and guessing a user's country is worse than asking.
 * It is a required field on the profile form, so anyone editing their profile
 * will be prompted for it.
 *
 * Idempotent - users that already have a callsign are skipped, so it is safe to
 * run more than once.
 */
const mongoose = require("mongoose");
const secrets = require("../config/secrets");
const User = require("../models/user");

async function main() {
	await mongoose.connect(secrets.db);
	console.log("Connected. Scanning users...");

	// .lean() so we see the raw documents, including the legacy `location`
	// field that is no longer in the schema.
	const users = await User.find({}).lean();
	let migrated = 0;
	let skipped = 0;

	for (const raw of users) {
		if (raw.callsign) {
			console.log(`  skip  ${raw.email} - already has callsign ${raw.callsign}`);
			skipped++;
			continue;
		}

		const set = {};

		if (raw.screenName) {
			set.callsign = String(raw.screenName).trim().toLowerCase();
		}

		if (raw.location) {
			const parts = String(raw.location).split(",");
			if (parts.length > 1) {
				set.state = parts.pop().trim();
				set.city = parts.join(",").trim();
			} else {
				set.city = String(raw.location).trim();
			}
		}

		if (!Object.keys(set).length) {
			console.log(`  skip  ${raw.email} - nothing to migrate`);
			skipped++;
			continue;
		}

		await User.collection.updateOne(
			{ _id: raw._id },
			{ $set: set, $unset: { location: "" } }
		);

		console.log(
			`  move  ${raw.email} - callsign=${set.callsign || "(none)"} ` +
			`city=${set.city || "(none)"} state=${set.state || "(none)"} country=(blank, needs input)`
		);
		migrated++;
	}

	console.log(`\nDone. ${migrated} migrated, ${skipped} skipped.`);
	await mongoose.disconnect();
}

main().catch(err => {
	console.error("Migration failed:", err);
	process.exit(1);
});

const Talkgroup = require("../models/talkgroup");
const System = require("../models/system");
const fs = require('fs');
const { parse } = require('csv-parse/sync');

const BINARY_MESSAGE = "This looks like an Excel or other binary file. Please save it as CSV (Comma delimited) and upload that.";
const REQUIRED_COLUMNS = ["Decimal", "Alpha Tag", "Description"];

// Quote a CSV field per RFC 4180 only when needed.
function csvField(value) {
  if (value === undefined || value === null) return "";
  const str = String(value);
  if (/[",\r\n]/.test(str) || /^\s|\s$/.test(str)) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}
exports.csvField = csvField;

//router.get("/tg_export/:shortName", isLoggedIn, function(req, res) {
exports.exportTalkgroups = async function (req, res, next) {
  const shortName = req.params.shortName.toLowerCase();
  const system = await System.findOne({ shortName: shortName });
  if (!system) {
    res.status(404);
    res.json({
      success: false,
      message: "That Short Name does not exist."
    });
    return;
  }
  if (!system.userId || !system.userId.equals(req.user._id)) {
    res.status(401);
    res.json({
      success: false,
      message: "You are not the user associated with this system."
    });
    return;
  }
  const talkgroups = await Talkgroup.find({ shortName: shortName });

  if (!talkgroups || !Array.isArray(talkgroups)) {
    res.status(404);
    res.json({
      success: false,
      message: "Talkgroups were not found."
    });
    return;
  }

  // Build the whole body first so an error cannot leave a half-written response.
  let out = "Decimal,Alpha Tag,Description,Priority\r\n";
  talkgroups.forEach(function (item) {
    if (!item) return;
    out += [
      csvField(item.num),
      csvField(item.alpha),
      csvField(item.description),
      csvField(item.priority)
    ].join(",") + "\r\n";
  });
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/csv");
  res.end(out);
}

class ImportError extends Error { }

// Reads, validates and de-duplicates the CSV. Throws ImportError (message is user-safe) on any problem.
// Writes nothing to the database.
function parseTalkgroupCsv(buffer) {
  if (buffer.length >= 2 && buffer[0] === 0x50 && buffer[1] === 0x4b) { // "PK" zip, i.e. .xlsx
    throw new ImportError(BINARY_MESSAGE);
  }
  if (buffer.includes(0)) {
    throw new ImportError(BINARY_MESSAGE);
  }
  let text = buffer.toString("utf8");
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);

  let records;
  let headers = [];
  try {
    records = parse(text, {
      columns: (header) => {
        headers = header.map(h => String(h).trim());
        return headers;
      },
      ltrim: true,
      rtrim: true,
      skip_empty_lines: true,
      relax_column_count: true,
      info: true
    });
  } catch (err) {
    const line = err && (err.lines || (err.info && err.info.lines));
    const reason = (err && err.message) ? err.message : "unknown error";
    throw new ImportError("The CSV file could not be read" + (line ? " (line " + line + ")" : "") + ": " + reason);
  }

  const missing = REQUIRED_COLUMNS.filter(c => !headers.includes(c));
  if (missing.length) {
    throw new ImportError("Column Headers are required - missing column(s): " + missing.map(m => "'" + m + "'").join(", ") +
      ". Required Columns: 'Decimal' 'Description' 'Alpha Tag' Optional Column: 'Priority'");
  }
  if (!records.length) {
    throw new ImportError("The CSV file has no talkgroup rows, so nothing was changed.");
  }

  const bad = [];
  let badCount = 0;
  const seen = new Set();
  const docs = [];
  let duplicates = 0;
  for (const { record: row, info } of records) {
    const line = info.lines;
    const decimal = String(row["Decimal"] === undefined ? "" : row["Decimal"]).trim();
    const priorityRaw = row["Priority"] === undefined ? "" : String(row["Priority"]).trim();
    const problems = [];
    if (!/^\d+$/.test(decimal)) {
      problems.push("Decimal '" + decimal + "' is not a whole number");
    }
    let priority;
    if (priorityRaw !== "") {
      if (Number.isFinite(Number(priorityRaw))) {
        priority = Number(priorityRaw);
      } else {
        problems.push("Priority '" + priorityRaw + "' is not a number");
      }
    }
    if (problems.length) {
      badCount++;
      if (bad.length < 10) bad.push("line " + line + ": " + problems.join("; "));
      continue;
    }
    const num = parseInt(decimal, 10);
    if (!Number.isSafeInteger(num)) {
      badCount++;
      if (bad.length < 10) bad.push("line " + line + ": Decimal '" + decimal + "' is too large");
      continue;
    }
    if (seen.has(num)) {
      duplicates++;
      continue;
    }
    seen.add(num);
    docs.push({
      num: num,
      alpha: String(row["Alpha Tag"] === undefined ? "" : row["Alpha Tag"]).toLowerCase(),
      description: row["Description"] === undefined ? "" : row["Description"],
      priority: priority
    });
  }
  if (badCount) {
    throw new ImportError("Nothing was imported because " + badCount + " row(s) have problems. " +
      (badCount > bad.length ? "First " + bad.length + ": " : "") + bad.join(" | "));
  }
  return { docs, duplicates };
}
exports.parseTalkgroupCsv = parseTalkgroupCsv;

async function removeUpload(file) {
  if (!file || !file.path) return;
  try {
    await fs.promises.unlink(file.path);
  } catch (err) {
    if (!err || err.code !== "ENOENT") {
      console.error("Could not delete upload " + file.path + ": " + (err && err.message));
    }
  }
}

// The client renders error bodies from this route as plain text, so errors here are strings.
//router.post("/tg_import/:shortName", isLoggedIn, upload.single('file'), function(req, res, next) {
exports.importTalkgroups = async function (req, res, next) {
  try {
    const shortName = req.params.shortName.toLowerCase();
    const system = await System.findOne({ shortName: shortName });

    if (!system) {
      console.error("Error - importTalkgroups: System not found - " + shortName);
      res.status(404).send("That Short Name does not exist.");
      return;
    }
    if (!system.userId || !system.userId.equals(req.user._id)) {
      console.error("Error - importTalkgroups: you are not the user for the system: " + req.user._id);
      res.status(401).send("You are not the user associated with this system.");
      return;
    }
    if (!req.file || req.file.size === 0) {
      console.error("Error - File is bad. Size");
      res.status(400).send("Please select a file.");
      return;
    }

    let buffer;
    try {
      buffer = await fs.promises.readFile(req.file.path);
    } catch (err) {
      console.error("Error - importTalkgroups: could not read upload: " + (err && err.message));
      res.status(500).send("The uploaded file could not be read. Please try again.");
      return;
    }

    let parsed;
    try {
      parsed = parseTalkgroupCsv(buffer);
    } catch (err) {
      if (err instanceof ImportError) {
        res.status(400).send(err.message);
        return;
      }
      throw err;
    }

    // Everything validated: only now touch the database.
    const docs = parsed.docs.map(d => Object.assign({}, d, { shortName: system.shortName }));
    await Talkgroup.deleteMany({ shortName: system.shortName });
    if (docs.length) {
      await Talkgroup.insertMany(docs, { ordered: false });
    }

    // The client replaces its talkgroup list with this array.
    const response = docs.map(d => ({ num: d.num, alpha: d.alpha, description: d.description }));
    res.set("X-Talkgroups-Imported", String(docs.length));
    res.set("X-Talkgroups-Duplicates-Skipped", String(parsed.duplicates));
    res.json(response);
  } catch (err) {
    console.error("Error - importTalkgroups: " + (err && err.stack || err));
    if (!res.headersSent) {
      res.status(500).send("Import failed. Please try again.");
    }
  } finally {
    await removeUpload(req.file);
  }
};


// -------------------------------------------

exports.fetchTalkgroups = async function (req, res, next) {
  const talkgroups = await Talkgroup.find({ shortName: req.params.shortName.toLowerCase() });
  res.json(talkgroups);
}

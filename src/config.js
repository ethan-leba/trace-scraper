require("dotenv").config();

module.exports = {
    get_env: get_env
}

function checkMissing(dict) {
    const missing = Object.entries(dict).filter(([, value]) => value === undefined);
    if(missing.length > 0) {
       throw missing.map(([head]) => head).join(", ") + " missing environment declarations";
    } else {
       return dict;
    }
}

function get_env() {
    let env = {
      no_page_workers: process.env.NO_PAGE_WORKERS || 5,
      no_class_workers: process.env.NO_CLASS_WORKERS || 5,
      myNEU_username: process.env.MYNEU_USERNAME,
      myNEU_password: process.env.MYNEU_PASSWORD,
      rabbit_uri: process.env.RABBIT_URI || "amqp://localhost",
      rabbit_queue: process.env.RABBIT_QUEUE || "development_queue",
      verbose: process.argv.includes("-v"),
      debug: process.argv.includes("-d"),
      no_pages: process.argv[2]
    }
    return checkMissing(env);
}


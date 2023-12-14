

class Database {

  constructor(binding) {
    this.binding = binding
  }

  prepare(query) {
    return new PreparedStatement(this, query)
  }

  async dump() {
    return new ArrayBuffer(1)
  }

  async batch(statements) {
    const action = this.binding.transaction((stmts) => {
      const results = []
      for (const stmt of stmts) {
        results.push(stmt._run())
      }
      return results
    });

    try {
      return action(statements)
    } catch (e) {
      return e
    }
  }

  async exec(query) {
    this.binding.exec(query)
    return {
      count: Infinity,
      duration: 0
    }
  }

}

class PreparedStatement {
  constructor(database, statement, values) {
    this.database = database
    this.statement = statement
    this.params = values || []
  }

  bind(...values) {
    return new PreparedStatement(this.database, this.statement, values)
  }

  async first(colName) {
    const result = this.database.binding.prepare(this.statement).get(this.params)
    if (colName){
      return result[colName]
    }
    return result
  }

  async run(){
    return this._run()
  }

  _run() {
    const result = this.database.binding.prepare(this.statement).run(this.params)
    return {
      results: [],
      success: true,
      meta: {
        last_row_id: result.lastInsertRowid,
        changes: result.changes
      }
    }
  }

  async all() {
    return {
      results: this.database.binding.prepare(this.statement).all(this.params),
      success: true,
      meta: {}
    }
  }

  async raw() {
    return this.database.binding.prepare(this.statement).bind(this.params).raw(true).all()
  }
}

let d1 = null

module.exports = {
  ensureInitialized: function(path, options){
    if (process.env.NODE_ENV === "development" && d1 == null){
      const db = require('better-sqlite3')(path, options);
      db.pragma('journal_mode = WAL');
      d1 = new Database(db)
    }
  },
  get: function (){
    return d1
  }

}
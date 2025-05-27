/**
 * Class for syncing GSD entries with Airtable
 */
class AirtableSync {
  /**
   * Creates an instance of AirtableSync
   * @param {string} apiKey - Airtable API key
   * @param {string} baseId - Airtable base ID
   */
  constructor(apiKey, baseId) {
    this.apiKey = apiKey;
    this.baseId = baseId;
    this.airtable = null;
    this.base = null;
    this.deviceId = this._getDeviceId();
    this.tableId = "GSD";
  }

  /**
   * Initializes the Airtable connection
   * @returns {AirtableSync} Returns this instance for chaining
   */
  initialize() {
    const Airtable = require("airtable");
    const airtable = new Airtable({ apiKey: this.apiKey });
    this.base = airtable.base(this.baseId);
    return this;
  }

  /**
   * Creates a new entry in Airtable
   * @param {Object} entry - The entry object to create
   * @param {string} entry.date - Entry date
   * @param {string} entry.time - Entry time
   * @param {number} [entry.sugar] - Sugar level
   * @param {string} [entry.comment] - Entry comment
   * @param {number} [entry.breadUnits] - Bread units
   * @param {Object} [entry.insulin] - Insulin information
   * @param {string} [entry.insulin.type] - Insulin type
   * @param {number} [entry.insulin.units] - Insulin units
   * @returns {Promise} Promise that resolves when entry is created
   */
  async createEntry(entry) {
    return this._wrapWithError(() =>
      this.base(this.tableId).create([
        {
          fields: {
            Date: entry.date,
            Time: entry.time,
            Sugar: entry.sugar || null,
            Comment: entry.comment || "",
            "Bread Units": entry.breadUnits || 0,
            "Insulin Type": entry.insulin?.type || null,
            "Insulin Units": entry.insulin?.units || null,
            "Entry ID": this._generateEntryId(entry.date, entry.time),
            "Device ID": this.deviceId,
            "Updated At": new Date().toISOString(),
          },
        },
      ])
    )();
  }

  /**
   * Updates an existing entry in Airtable
   * @param {Object} entry - The entry object to update
   * @param {string} entry.date - Entry date
   * @param {string} entry.time - Entry time
   * @param {number} [entry.sugar] - Sugar level
   * @param {string} [entry.comment] - Entry comment
   * @param {number} [entry.breadUnits] - Bread units
   * @param {Object} [entry.insulin] - Insulin information
   * @param {string} [entry.insulin.type] - Insulin type
   * @param {number} [entry.insulin.units] - Insulin units
   * @returns {Promise} Promise that resolves when entry is updated
   */
  async updateEntry(entry) {
    return this._wrapWithError(async () => {
      const recordId = await this._fetchExistingRecordIdOrThrow(
        entry.date,
        entry.time
      );
      await this.base(this.tableId).update([
        {
          id: recordId,
          fields: {
            Sugar: entry.sugar || null,
            Comment: entry.comment || "",
            "Bread Units": entry.breadUnits || 0,
            "Insulin Type": entry.insulin?.type || null,
            "Insulin Units": entry.insulin?.units || null,
            "Updated At": new Date().toISOString(),
          },
        },
      ]);
    })();
  }

  /**
   * Deletes an entry from Airtable
   * @param {string} date - Entry date
   * @param {string} time - Entry time
   * @returns {Promise} Promise that resolves when entry is deleted
   */
  async deleteEntry(date, time) {
    return this._wrapWithError(async () => {
      const recordId = await this._fetchExistingRecordIdOrThrow(date, time);
      await this.base(this.tableId).destroy([recordId]);
    })();
  }

  /**
   * Fetches the Airtable record ID for an existing entry
   * @param {string} date - Entry date
   * @param {string} time - Entry time
   * @returns {Promise<string|null>} The record ID or null if not found
   * @private
   */
  async _fetchExistingRecordIdOrThrow(date, time) {
    const entryId = this._generateEntryId(date, time);
    const existingRecords = await this.base(this.tableId)
      .select({
        fields: ["Entry ID"],
        filterByFormula: `AND({Device ID} = '${this.deviceId}', {Entry ID} = '${entryId}')`,
      })
      .firstPage();
    if (existingRecords.length === 0) {
      throw new Error(
        `Entry ${entryId} not found, date: ${date}, time: ${time}`
      );
    }
    return existingRecords[0].id;
  }

  /**
   * Wraps a function with error handling
   * @param {Function} fn - Function to wrap
   * @returns {Function} Wrapped function that catches and logs errors
   * @private
   */
  _wrapWithError(fn) {
    return async (...args) => {
      try {
        await fn(...args);
      } catch (error) {
        console.error("Failed", error);
      }
    };
  }

  /**
   * Gets or generates a unique device ID
   * @returns {string} The device ID
   * @private
   */
  _getDeviceId() {
    let deviceId = localStorage.getItem("deviceId");
    if (!deviceId) {
      deviceId =
        "device_" +
        Math.random().toString(36).substr(2, 9) +
        "_" +
        Date.now().toString(36);
      localStorage.setItem("deviceId", deviceId);
    }
    return deviceId;
  }

  /**
   * Generates a unique entry ID from date and time
   * @param {string} date - Entry date
   * @param {string} time - Entry time
   * @returns {string} The generated entry ID
   * @private
   */
  _generateEntryId(date, time) {
    return `${date}_${time}`;
  }
}

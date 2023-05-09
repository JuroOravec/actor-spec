/**
 * ActorSpec refers an actor in the sense of a bot / serverless cloud program
 * as defined by Apify (https://docs.apify.com/platform/actors).
 *
 * However, this description of an actor is for my (Juro's) own needs of managing
 * possibly many actors across possibly many platforms written in possibly many repos.
 *
 * Hence, some differences are:
 * - ActorSpec description is platform agnostic (e.g. Apify is a platform) - there might be
 *   other actors on other platforms.
 * - ActorSpec is not an actor itself, but rather a reference to an actor living
 *   in some platform.
 * - Aim of this reference is to keep track of things like featureset, performance / price,
 *   which websites it works with, what it does (eg what data it extracts if it's a scraper),
 *   who are the authors, privacy compliance, etc.
 */
export interface ActorSpec {
  /** Currently only version 1 exists */
  actorspecVersion: number;
  /** Info about the actor itself */
  actor: {
    title: string;
    publicUrl: string | null;
    shortDesc: string;
    /** Image that shows overview of the extracted data */
    datasetOverviewImgUrl: string | null;
  };
  platform: {
    /** E.g. 'apify' */
    name: string;
    /** URL to the platform's homepage */
    url: string;
    /**
     * ID the author has on the platform - We assume the platform is
     * a marketplace like Apify, where authorId is meaningful.
     */
    authorId: string;
    /** If the platform supports profile pages for authors of actors, it is here. */
    authorProfileUrl: string | null;
    /**
     * ID the actor has on the platform - We assume the platform is
     * a marketplace like Apify, where authorId is meaningful.
     */
    actorId: string;
    /** Various social links */
    socials?: {
      discord?: string;
    };
  };
  /** Authors that wrote this actor */
  authors: {
    name: string;
    email: string;
    authorUrl: string | null;
  }[];
  /** The websites the actor works with */
  websites: {
    name: string;
    url: string;
  }[];
  /** Pricing of the actor. Based on Apify. */
  pricing: {
    /** E.g. none (free), monthly fee, one-off fee, or per X results */
    pricingType: string;
    /** E.g. the `8` in `"$8 per month"` */
    value: number;
    /** E.g. the `"usd"` in `"$8 per month"` */
    currency: string;
    /** E.g. the `1000` in `"$0.50 per 1000 entries"` */
    period: number;
    /** E.g. the `"entries"` in `"$0.50 per 1000 entries"` */
    periodUnit: string;
  };
}

/**
 * ActorSpec that describes an actor / bot that's a scraper,
 * AKA this actor is expected to extract data.
 *
 * Hence, this actor spec includes additional info about the datasets
 * that can be extracted.
 */
export interface ScraperActorSpec extends ActorSpec {
  datasets: ScraperDataset[];
}

export interface ScraperDataset {
  /** Dataset name, e.g. `'organisations'` */
  name: string;
  shortDesc: string;
  /** URL to the dataset */
  url: string;
  /** Total size of the dataset */
  size: number;
  /** Whether the dataset is extracted when the actor is run with default settings */
  isDefault: boolean;
  /**
   * List of filter names that can be set when using the actor to scrape this dataset.
   *
   * The names are indicative only, and do not need to match up with the actual filters
   * or their IDs in the code.
   *
   * E.g.
   * ```ts
   * ['geographic region (kraj)', 'starting letter']
   * ```
   */
  filters: string[];
  filterCompleteness: DatasetFilterCompleteness;
  /** Scraper modes that impact the pricing, performance, or what kind of data is returned. */
  modes: DatasetModes[];
  /** Describes what features the dataset has. */
  features: DatasetFeatures;
  /**
   * List of performance / cost datapoints that's rendered as a table.
   *
   * E.g.
   * ```
   * [
   *   { rowId: 'fast', colId: '100items', count: 100, costUsd: 0.014, timeSec: 120 },
   *   { rowId: 'fast', colId: 'fullRun', count: 'all', costUsd: 0.289, timeSec: 2520 },
   *   { rowId: 'detailed', colId: '100items', count: 100, costUsd: 0.08, timeSec: 697 },
   *   { rowId: 'detailed', colId: 'fullRun', count: 'all', costUsd: 2.008, timeSec: 17520 },
   * ],
   * ```
   */
  perfStats: DatasetPerfStat[];
  privacy: {
    /**
     * Properties on entry object that are considered personal data
     *
     * E.g. `['email', 'phone']`
     */
    personalDataFields: string[];
    /**
     * Whether the actor redacts the values of the fields that contain
     * personal data (as set by `personalDataFields`)
     * so as not to breach data / privacy regulations.
     */
    isPersonalDataRedacted: boolean;
    /**
     * List of groups of people whose personal data is in the dataset.
     *
     * E.g. `['employees', 'researchers']`
     */
    personalDataSubjects: string[];
  };
  output: DatasetOutput;
}

export interface DatasetOutput<TEntry extends object = any> {
  /** Example single extracted entry */
  exampleEntry: TEntry;
  /**
   * Comments related to individual fields of `exampleEntry`
   *
   * These comments may be rendered as such:
   *
   * ```json
   * {
   *   "exampleEntryField1": 22,
   *   // This is a comment from exampleEntryComments.exampleEntryField2
   *   "exampleEntryField2": "Value from exampleEntry.exampleEntryField2"
   * }
   * ```
   */
  exampleEntryComments?: Partial<Record<keyof TEntry, string>>;
}

/** Describes which features a given dataset has. */
export interface DatasetFeatures {
  /**
   * Whether the scraper needs browser (e.g. using Playwright or Puppeteer)
   * to interact with the browser.
   *
   * Scrapers that don't use browser may be faster.
   */
  usesBrowser: boolean;
  /** Whether the scraper allows to configure proxy. */
  proxySupport: boolean;
  /**
   * Whether the way the scraper works can be configured -
   * e.g. retry strategy, rate limiting, etc.
   */
  configurable: boolean;
  /**
   * Whether the scraper is tested on regular basis,
   * e.g. once per day or week.
   */
  regularlyTested: boolean;
  /**
   * Whether the scraper complies with data / privacy
   * regulations, e.g. that personal data is omitted or
   * redacted by default.
   */
  privacyCompliance: boolean;
  /** Whether the scraper captures and reports errors. */
  errorMonitoring: boolean;
}

/**
 * Is a scraper has multiple configurations / working modes that impact
 * the pricing, performance, or what kind of data is returned, we call
 * these the actor "modes".
 *
 * E.g.
 * ```
 * [
 *   { name: 'Fast', isDefault: true, shortDesc: 'only data on the entries themselves' },
 *   { name: 'Detailed', isDefault: false, shortDesc: 'includes all relationships' },
 * ];
 * ```
 */
export interface DatasetModes {
  /** Name of the mode */
  name: string;
  /** Whether this mode is the default when the actor is extracting this dataset with default settings */
  isDefault: boolean;
  shortDesc: string;
}

/**
 * Single performance / cost datapoint of a scraper actor.
 *
 * This data helps us to compare this scraper against others,
 * or to know how much a run will cost / take time.
 *
 * E.g.
 * ```
 * perfStats = [
 *   { rowId: 'fast', colId: '100items', count: 100, costUsd: 0.014, timeSec: 120 },
 *   { rowId: 'fast', colId: 'fullRun', count: 'all', costUsd: 0.289, timeSec: 2520 },
 *   { rowId: 'detailed', colId: '100items', count: 100, costUsd: 0.08, timeSec: 697 },
 *   { rowId: 'detailed', colId: 'fullRun', count: 'all', costUsd: 2.008, timeSec: 17520 },
 * ];
 * ```
 */
export interface DatasetPerfStat {
  rowId: string;
  colId: string;
  costUsd: number;
  timeSec: number;
  mode: string | null;
  count: number | 'all';
}

/**
 * The state of dataset filters:
 * - `none` - no filters available
 * - `some` - some filters available
 * - `full` - all filters that are available in the original web / UI / API are supported
 * - `extra` - same as `full`, plus extra filters
 */
export type DatasetFilterCompleteness = 'none' | 'some' | 'full' | 'extra';

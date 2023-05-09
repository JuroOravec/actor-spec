# TODO

- Create Website entity
  - Context:
      - Currently, we depend on the actors to tell us info about websites like what filters are available there (and whether the scraper matches all filter options)
      - While this is OK while we manage all scrapers that use actor-spec,
      this could lead to ambiguity once more stakeholders write actors for the
      same websites.
      - Hence, we sould create an entity that represents Website/API, that would store the info that's own to the website and which is the same across all actors interacting with that page.
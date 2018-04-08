
CREATE TABLE recordings (
    projectid integer NOT NULL,
    audio text,
    video text
);

CREATE TABLE el_history (
    projectid integer NOT NULL,
    el_count integer NOT NULL,
    type text,
    d text,
    color text,
    size text
);

CREATE TABLE recordings (
    projectId integer NOT NULL,
    audio text,
    video text
);

CREATE TABLE el_history (
    projectId integer NOT NULL,
    element_type text,
    el_data text,
    color text,
    size text
);
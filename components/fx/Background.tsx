import Constellation from "./Constellation";

// The living backdrop: aurora blobs (pure CSS, GPU transforms), film grain,
// and the constellation canvas. Content mounts above at z-10.
export default function Background() {
  return (
    <>
      <div className="aurora print:hidden" aria-hidden="true">
        <div className="aurora__blob aurora__blob--1" />
        <div className="aurora__blob aurora__blob--2" />
        <div className="aurora__blob aurora__blob--3" />
      </div>
      <Constellation />
    </>
  );
}

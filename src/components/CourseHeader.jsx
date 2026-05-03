/**
 * CourseHeader
 * Paper-white band that spans the full width of the main content area,
 * containing the PageHeader (breadcrumb + title) and the Tabs bar.
 * Bleeds out of the main padding on both desktop and mobile.
 */
export default function CourseHeader({ children }) {
  return (
    <>
      <style>{`
        .course-header-band {
          margin: 0 -42px;
          background: var(--color-surface);
          border-bottom: 3px solid var(--color-border);
        }
        .course-header-inner {
          padding: 28px 42px 0;
        }
        @media (max-width: 768px) {
          .course-header-band { margin: 0 -20px; }
          .course-header-inner { padding: 20px 20px 0; }
        }
      `}</style>
      <div className="course-header-band">
        <div className="course-header-inner">
          {children}
        </div>
      </div>
    </>
  )
}

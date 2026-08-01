import Link from "next/link";

import { signOutWorker } from "@/app/worker/actions";
import { WorkerNavigation } from "@/components/worker/worker-navigation";
import type { WorkerSession } from "@/lib/auth/worker-session";
import type { DashboardNotification } from "@/lib/worker/dashboard-types";

export function WorkerShell({
  session,
  notifications,
  children
}: {
  session: WorkerSession;
  notifications: DashboardNotification[];
  children: React.ReactNode;
}): React.JSX.Element {
  const unread = notifications.filter((notification) => notification.unread);

  return (
    <div className="portal-shell">
      <a className="skip-link" href="#main-content">Skip to main content</a>

      <aside className="portal-sidebar" aria-label="Worker Portal navigation">
        <Link className="brand-mark brand-mark-light portal-brand" href="/worker/dashboard">
          <span className="brand-symbol" aria-hidden="true">HV</span>
          <span>
            HSE Verify
            <small>Worker Portal</small>
          </span>
        </Link>

        <WorkerNavigation />

        <div className="portal-sidebar-note">
          <strong>Portal isolation</strong>
          <p>This session grants Worker Portal access only.</p>
        </div>
      </aside>

      <div className="portal-main-column">
        <header className="portal-header">
          <div className="mobile-brand">
            <Link className="brand-mark" href="/worker/dashboard">
              <span className="brand-symbol" aria-hidden="true">HV</span>
              <span>HSE Verify</span>
            </Link>
          </div>

          <div className="header-context">
            <span className="role-chip">Worker Portal</span>
          </div>

          <div className="header-actions">
            <details className="header-menu notification-menu">
              <summary aria-label={`${unread.length} unread notifications`}>
                <span aria-hidden="true">♢</span>
                {unread.length > 0 ? <span className="notification-count">{unread.length}</span> : null}
              </summary>
              <div className="menu-panel notification-panel">
                <div className="menu-heading">
                  <strong>Notifications</strong>
                  <span>{unread.length} unread</span>
                </div>
                {notifications.length === 0 ? (
                  <p className="menu-empty">No notifications.</p>
                ) : (
                  <ul className="notification-list">
                    {notifications.slice(0, 5).map((notification) => (
                      <li key={notification.id}>
                        <Link href={notification.href}>
                          <strong>{notification.title}</strong>
                          <span>{notification.description}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </details>

            <details className="header-menu profile-menu">
              <summary>
                <span className="avatar" aria-hidden="true">
                  {session.displayName.slice(0, 1).toUpperCase()}
                </span>
                <span className="profile-summary-text">
                  <strong>{session.displayName}</strong>
                  <small>{session.workerId}</small>
                </span>
              </summary>
              <div className="menu-panel profile-panel">
                <div className="profile-panel-identity">
                  <strong>{session.displayName}</strong>
                  <span>{session.email}</span>
                </div>
                <Link href="/worker/profile">My profile</Link>
                <Link href="/">Exit portal</Link>
                <form action={signOutWorker}>
                  <button type="submit">Sign out</button>
                </form>
              </div>
            </details>
          </div>
        </header>

        <main className="portal-content" id="main-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}

/** Layout intentionally stays server-rendered; authenticated content will be
 * introduced here only after the Backend session response is approved. */
export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}

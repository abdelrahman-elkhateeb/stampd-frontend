import { EmployeesLayout } from "@/features/employees/employees-layout"

export default function Layout({ children }: { children: React.ReactNode }) {
  return <EmployeesLayout>{children}</EmployeesLayout>
}

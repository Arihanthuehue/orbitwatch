# ORBITWATCH: SQL Scripts Index & Viva Defense Reference

All SQL scripts are organized cleanly in the `/db` directory for modular execution, inspection, and defense during the laboratory evaluation.

---

## 1. File Catalog

| Script Name | Purpose & Course Component | Key DBMS Concepts Demonstrated |
| :--- | :--- | :--- |
| `01_schema.sql` | Core DDL & Relational Structure | InnoDB Engine, Primary Keys, Foreign Keys, Unique Keys, CHECK Constraints, Range Partitioning by Year. |
| `02_constraints_indexes.sql` | B-Tree & Composite Performance Indexes | Composite Indexes `(orbit_class, Perigee_KM)`, `(Satellite_ID, Collision_Risk_Prob)`, Covering Indexes, Range Scans. |
| `03_views.sql` | Relational & Role-Restricted Views | `v_high_risk_events`, `v_debris_catalog`, `v_satellite_exposure`, `v_station_workload`, `v_public_researcher_catalog`. |
| `04_functions.sql` | Stored Deterministic Scalar Functions | `Classify_Orbit` (LEO/MEO/GEO/HEO), `Risk_Level` (NASA CARA threshold mapping), `Calculate_Kinetic_Energy` ($E_k = \frac{1}{2}mv^2$), `Calculate_Semi_Major_Axis`. |
| `05_procedures.sql` | Stored Procedures & Advanced SQL | `Get_Top10_Risky_Debris`, `Fetch_Object_Lineage` (Recursive CTE), `Register_Satellite` (Atomic Insert), `Record_Collision_Event`, `Escalate_High_Risk_Events` (Explicit CURSOR). |
| `06_triggers.sql` | Validation, Auditing & Archiving Triggers | `trg_validate_satellite_before_insert` (SIGNAL 45000), `trg_validate_debris_before_insert`, `trg_collision_event_after_insert` (Auto-Alert & Audit), `trg_satellite_orbit_history_before_update`. |
| `07_roles.sql` | Database Security & RBAC | MySQL Native Roles (`role_admin`, `role_agency`, `role_operator`, `role_researcher`), GRANT / REVOKE, Default Roles, User Provisioning. |
| `08_demo_transactions.sql` | ACID Transactions Scenarios | Demonstrable `COMMIT` (multi-table atomic write), `SAVEPOINT` & `ROLLBACK TO SAVEPOINT` (partial failure recovery), `ROLLBACK` (transaction abort). |
| `09_index_benchmark.sql` | Execution Plan Benchmarking | `EXPLAIN` and `EXPLAIN ANALYZE` scripts proving index range scans and partition pruning on `OBSERVATION` (`partitions: p2026`). |

---

## 2. Quick Execution Command on Local MySQL

To execute or re-initialize all scripts at once in order:

```powershell
Get-ChildItem -Path "db\*.sql" | Sort-Object Name | ForEach-Object {
    Write-Host "Executing $($_.Name)..."
    Get-Content $_.FullName -Raw | & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p"Arihant@006"
}
```

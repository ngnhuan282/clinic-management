# Vietnamese content verification

Run `dotnet run --project tests/VietnameseContentVerification` on Windows with SQL Server LocalDB available.

The executable owns a randomly named `ClinicContent_...` database and removes only that database in `finally`. It verifies upgrade from the preceding migration, exact-value Unicode repairs, preservation of custom descriptions and biographies, stable identifiers/row counts/permissions, idempotence, and the comprehensive demo seed against the current migration chain. It then checks coverage of all 20 public specialty descriptions and accented catalog, doctor, room and prescription labels.

No application database is used. The comprehensive demo seed is executed only inside this disposable fixture.

using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Pati.API.Migrations
{
    /// <inheritdoc />
    public partial class AddVetExpenses : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "vet_expenses",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    cat_id = table.Column<Guid>(type: "uuid", nullable: false),
                    title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    category = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    clinic_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    expense_date = table.Column<DateOnly>(type: "date", nullable: false),
                    amount = table.Column<decimal>(type: "numeric(12,2)", nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_vet_expenses", x => x.id);
                    table.ForeignKey(
                        name: "FK_vet_expenses_cats_cat_id",
                        column: x => x.cat_id,
                        principalTable: "cats",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "vet_payments",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    expense_id = table.Column<Guid>(type: "uuid", nullable: false),
                    amount = table.Column<decimal>(type: "numeric(12,2)", nullable: false),
                    paid_at = table.Column<DateOnly>(type: "date", nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_vet_payments", x => x.id);
                    table.ForeignKey(
                        name: "FK_vet_payments_vet_expenses_expense_id",
                        column: x => x.expense_id,
                        principalTable: "vet_expenses",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_vet_expenses_cat_id",
                table: "vet_expenses",
                column: "cat_id");

            migrationBuilder.CreateIndex(
                name: "IX_vet_payments_expense_id",
                table: "vet_payments",
                column: "expense_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "vet_payments");

            migrationBuilder.DropTable(
                name: "vet_expenses");
        }
    }
}

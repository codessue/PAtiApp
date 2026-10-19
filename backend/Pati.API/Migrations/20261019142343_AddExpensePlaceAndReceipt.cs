using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Pati.API.Migrations
{
    /// <inheritdoc />
    public partial class AddExpensePlaceAndReceipt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "place",
                table: "vet_expenses",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "vet");

            migrationBuilder.AddColumn<string>(
                name: "receipt_url",
                table: "vet_expenses",
                type: "character varying(300)",
                maxLength: 300,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "place",
                table: "vet_expenses");

            migrationBuilder.DropColumn(
                name: "receipt_url",
                table: "vet_expenses");
        }
    }
}

using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Pati.API.Migrations
{
    /// <inheritdoc />
    public partial class AddPetSpecies : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "species",
                table: "cats",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "kedi");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "species",
                table: "cats");
        }
    }
}

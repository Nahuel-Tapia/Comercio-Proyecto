using ECommerce.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.Infrastructure.Persistence
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Product> Products { get; set; } = null!;
        public DbSet<Order> Orders { get; set; } = null!;
        public DbSet<OrderItem> OrderItems { get; set; } = null!;
        public DbSet<User> Users { get; set; } = null!;
        public DbSet<Category> Categories { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            
            // Automatically apply all entity configurations from the assembly
            modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);

            // Dynamically configure shadow properties and soft delete filters for all entities
            foreach (var entityType in modelBuilder.Model.GetEntityTypes())
            {
                // Declare shadow properties
                modelBuilder.Entity(entityType.Name).Property<DateTime>("CreatedDate");
                modelBuilder.Entity(entityType.Name).Property<DateTime?>("LastModifiedDate");
                modelBuilder.Entity(entityType.Name).Property<bool>("IsDeleted").HasDefaultValue(false);

                // Build expression: e => !EF.Property<bool>(e, "IsDeleted")
                var parameter = System.Linq.Expressions.Expression.Parameter(entityType.ClrType, "e");
                var propertyMethod = typeof(EF).GetMethod(nameof(EF.Property), new[] { typeof(object), typeof(string) })!
                    .MakeGenericMethod(typeof(bool));
                var propertyAccess = System.Linq.Expressions.Expression.Call(propertyMethod, parameter, System.Linq.Expressions.Expression.Constant("IsDeleted"));
                var notExpression = System.Linq.Expressions.Expression.Not(propertyAccess);
                var lambda = System.Linq.Expressions.Expression.Lambda(notExpression, parameter);

                modelBuilder.Entity(entityType.ClrType).HasQueryFilter(lambda);
            }
        }

        public override int SaveChanges()
        {
            ApplyAuditAndSoftDelete();
            return base.SaveChanges();
        }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            ApplyAuditAndSoftDelete();
            return base.SaveChangesAsync(cancellationToken);
        }

        private void ApplyAuditAndSoftDelete()
        {
            var entries = ChangeTracker.Entries();

            foreach (var entry in entries)
            {
                switch (entry.State)
                {
                    case EntityState.Added:
                        entry.Property("CreatedDate").CurrentValue = DateTime.UtcNow;
                        entry.Property("LastModifiedDate").CurrentValue = DateTime.UtcNow;
                        entry.Property("IsDeleted").CurrentValue = false;
                        break;

                    case EntityState.Modified:
                        entry.Property("LastModifiedDate").CurrentValue = DateTime.UtcNow;
                        break;

                    case EntityState.Deleted:
                        // Convert physical deletion to soft delete
                        entry.State = EntityState.Modified;
                        entry.Property("IsDeleted").CurrentValue = true;
                        entry.Property("LastModifiedDate").CurrentValue = DateTime.UtcNow;
                        break;
                }
            }
        }
    }
}

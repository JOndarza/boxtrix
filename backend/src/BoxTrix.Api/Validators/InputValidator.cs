using BoxTrix.Api.Dtos;
using FluentValidation;

namespace BoxTrix.Api.Validators;

public sealed class InputValidator : AbstractValidator<InputDto>
{
    public InputValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.Areas).NotNull().Must(a => a.Count > 0).WithMessage("At least one area is required.");
        RuleFor(x => x.Boxes).NotNull();

        RuleForEach(x => x.Areas).SetValidator(new AreaValidator());
        RuleForEach(x => x.Boxes).SetValidator(new BoxValidator());
        When(x => x.Constraints is not null, () => RuleFor(x => x.Constraints!).SetValidator(new ConstraintsValidator()));
    }
}

public sealed class AreaValidator : AbstractValidator<AreaDto>
{
    public AreaValidator()
    {
        RuleFor(a => a.Id).NotEmpty();
        RuleFor(a => a.Width).GreaterThan(0);
        RuleFor(a => a.Height).GreaterThan(0);
        RuleFor(a => a.Depth).GreaterThan(0);
        RuleFor(a => a.MaxStackHeight).GreaterThan(0).When(a => a.MaxStackHeight.HasValue);

        When(a => a.ExitCorridor is not null, () =>
        {
            RuleFor(a => a.ExitCorridor!).SetValidator(new ExitCorridorValidator());
            RuleFor(a => a).Must(FitsInsideArea).WithMessage("Exit corridor must fit inside the area's bounding box.");
        });
    }

    private static bool FitsInsideArea(AreaDto a)
    {
        var c = a.ExitCorridor!;
        return c.X >= 0 && c.Y >= 0 && c.Z >= 0
            && c.X + c.Width <= a.Width
            && c.Y + c.Height <= a.Height
            && c.Z + c.Depth <= a.Depth;
    }
}

public sealed class ExitCorridorValidator : AbstractValidator<ExitCorridorDto>
{
    public ExitCorridorValidator()
    {
        RuleFor(c => c.Width).GreaterThan(0);
        RuleFor(c => c.Height).GreaterThan(0);
        RuleFor(c => c.Depth).GreaterThan(0);
    }
}

public sealed class BoxValidator : AbstractValidator<BoxDto>
{
    public BoxValidator()
    {
        RuleFor(b => b.Id).NotEmpty();
        RuleFor(b => b.Width).GreaterThan(0);
        RuleFor(b => b.Height).GreaterThan(0);
        RuleFor(b => b.Depth).GreaterThan(0);
        RuleFor(b => b.Weight).GreaterThanOrEqualTo(0).When(b => b.Weight.HasValue);
    }
}

public sealed class ConstraintsValidator : AbstractValidator<ConstraintsDto>
{
    public ConstraintsValidator()
    {
        RuleFor(c => c.MaxStackHeight).GreaterThan(0).When(c => c.MaxStackHeight.HasValue);
        RuleFor(c => c.MinSupportRatio).InclusiveBetween(0, 1).When(c => c.MinSupportRatio.HasValue);
    }
}

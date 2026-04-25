FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY BoxTrix.slnx Directory.Build.props ./
COPY src/BoxTrix.Domain/BoxTrix.Domain.csproj src/BoxTrix.Domain/
COPY src/BoxTrix.Application/BoxTrix.Application.csproj src/BoxTrix.Application/
COPY src/BoxTrix.Api/BoxTrix.Api.csproj src/BoxTrix.Api/
COPY tests/BoxTrix.Domain.Tests/BoxTrix.Domain.Tests.csproj tests/BoxTrix.Domain.Tests/
COPY tests/BoxTrix.Application.Tests/BoxTrix.Application.Tests.csproj tests/BoxTrix.Application.Tests/
COPY tests/BoxTrix.Api.Tests/BoxTrix.Api.Tests.csproj tests/BoxTrix.Api.Tests/
RUN dotnet restore src/BoxTrix.Api/BoxTrix.Api.csproj

COPY src/ src/
RUN dotnet publish src/BoxTrix.Api/BoxTrix.Api.csproj -c Release -o /app /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app ./
EXPOSE 4200
ENV ASPNETCORE_URLS=http://0.0.0.0:4200
ENTRYPOINT ["dotnet", "BoxTrix.Api.dll"]

$ErrorActionPreference = 'Stop'
$base = 'http://127.0.0.1:3000'
$results = [System.Collections.Generic.List[object]]::new()

function Test-InvalidApiInput {
  param(
    [string] $Label,
    [string] $Path,
    [hashtable] $Payload
  )

  $body = $Payload | ConvertTo-Json -Compress
  try {
    $response = Invoke-WebRequest `
      -Uri "$base$Path" `
      -Method Post `
      -ContentType 'application/json' `
      -Body $body `
      -UseBasicParsing
    $statusCode = [int] $response.StatusCode
  } catch {
    if (-not $_.Exception.Response) {
      throw
    }

    $statusCode = [int] $_.Exception.Response.StatusCode
  }

  $passed = $statusCode -eq 400
  $results.Add([pscustomobject]@{
    Test       = $Label
    StatusCode = $statusCode
    Passed     = $passed
  })

  if ($passed) {
    Write-Host "$Label -> HTTP $statusCode (PASS)" -ForegroundColor Green
  } else {
    Write-Host "$Label -> HTTP $statusCode (FAIL; expected 400)" -ForegroundColor Red
  }
}

$controlCharacter = [string] [char] 7
Test-InvalidApiInput 'SQLi missing username' '/api/sqli/test' @{
  mode = 'secure'
}
Test-InvalidApiInput 'SQLi bad mode' '/api/sqli/test' @{
  username = 'demo_guest'
  mode = 'hack'
}
Test-InvalidApiInput 'SQLi too long (81)' '/api/sqli/test' @{
  username = 'a' * 81
  mode = 'secure'
}
Test-InvalidApiInput 'SQLi control character' '/api/sqli/test' @{
  username = "abc$controlCharacter"
  mode = 'secure'
}
Test-InvalidApiInput 'XSS missing comment' '/api/xss/comments' @{
  mode = 'secure'
}
Test-InvalidApiInput 'XSS bad mode' '/api/xss/comments' @{
  comment = 'hi'
  mode = 'hack'
}
Test-InvalidApiInput 'XSS too long (1001)' '/api/xss/comments' @{
  comment = 'a' * 1001
  mode = 'secure'
}
Test-InvalidApiInput 'XSS control character' '/api/xss/comments' @{
  comment = "abc$controlCharacter"
  mode = 'secure'
}

$failedTests = @($results | Where-Object { -not $_.Passed })
Write-Host ''
Write-Host "Passed $($results.Count - $failedTests.Count) of $($results.Count) input-validation checks."
if ($failedTests.Count -gt 0) {
  throw 'One or more invalid inputs did not return HTTP 400.'
}

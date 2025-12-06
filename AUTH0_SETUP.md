# Auth0 Login Page Customization Guide

## Quick Setup

### Step 1: Access Auth0 Dashboard
1. Go to https://manage.auth0.com
2. Navigate to **Branding** → **Universal Login**

### Step 2: Basic Settings
1. Click **Settings** tab
2. Configure:
   - **Logo URL**: `https://recordcrate.netlify.app/auth0-logo.svg`
   - **Primary Color**: `#e8b968` (amber glow)
   - **Background Color**: `#1a1310` (dark chocolate brown)

### Step 3: Advanced Customization (Recommended)
1. Click **Advanced Options**
2. Toggle **Customize Login Page** to ON
3. Paste the template below

## RecordCrate Custom Login Template

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
  <title>Sign In | RecordCrate</title>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #1a1310 0%, #2d2119 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    
    .container {
      background: #f0e6d2;
      border-radius: 20px;
      box-shadow: 
        0 20px 60px rgba(0, 0, 0, 0.4),
        0 0 0 1px rgba(200, 149, 95, 0.2);
      padding: 48px 40px;
      max-width: 450px;
      width: 100%;
    }
    
    .logo {
      text-align: center;
      margin-bottom: 24px;
    }
    
    .logo svg {
      width: 64px;
      height: 64px;
    }
    
    h1 {
      font-size: 28px;
      font-weight: 800;
      color: #2a1f14;
      text-align: center;
      margin-bottom: 8px;
      letter-spacing: -0.02em;
    }
    
    .subtitle {
      text-align: center;
      color: #6d5539;
      font-size: 15px;
      margin-bottom: 32px;
      line-height: 1.5;
      font-weight: 500;
    }
    
    /* Auth0 Lock widget overrides */
    .auth0-lock.auth0-lock .auth0-lock-overlay {
      display: none;
    }
    
    .auth0-lock.auth0-lock .auth0-lock-widget {
      box-shadow: none;
      width: 100%;
      background: transparent;
    }
    
    .auth0-lock.auth0-lock .auth0-lock-header {
      display: none;
    }
    
    .auth0-lock.auth0-lock .auth0-lock-cred-pane {
      border-radius: 12px;
      background: #f0e6d2;
    }
    
    .auth0-lock.auth0-lock .auth0-lock-input-wrap {
      border-radius: 10px;
      border: 2px solid rgba(122, 95, 55, 0.2);
      transition: all 0.2s ease;
    }
    
    .auth0-lock.auth0-lock .auth0-lock-input-wrap:focus-within {
      border-color: #c8955f;
      box-shadow: 0 0 0 3px rgba(200, 149, 95, 0.15);
    }
    
    .auth0-lock.auth0-lock .auth0-lock-input {
      color: #2a1f14;
      font-weight: 500;
    }
    
    .auth0-lock.auth0-lock .auth0-lock-submit {
      background: linear-gradient(135deg, #e8b968 0%, #c8955f 100%);
      border-radius: 10px;
      height: 48px;
      font-weight: 700;
      font-size: 16px;
      letter-spacing: -0.01em;
      transition: all 0.2s ease;
      border: none;
      box-shadow: 0 4px 12px rgba(200, 149, 95, 0.25);
    }
    
    .auth0-lock.auth0-lock .auth0-lock-submit:hover {
      background: linear-gradient(135deg, #f2c978 0%, #d4a574 100%);
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(200, 149, 95, 0.35);
    }
    
    .auth0-lock.auth0-lock .auth0-lock-social-button {
      border-radius: 10px;
      height: 48px;
      font-weight: 600;
      transition: all 0.2s ease;
      border: 2px solid rgba(122, 95, 55, 0.2);
      background: #fff;
    }
    
    .auth0-lock.auth0-lock .auth0-lock-social-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      border-color: #c8955f;
    }
    
    .auth0-lock.auth0-lock .auth0-lock-alternative {
      color: #6d5539;
      font-weight: 500;
    }
    
    .auth0-lock.auth0-lock .auth0-lock-alternative-link {
      color: #c8955f;
      font-weight: 600;
    }
    
    @media (max-width: 480px) {
      .container {
        padding: 36px 28px;
      }
      
      h1 {
        font-size: 24px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#c8955f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M6 12c0-1.7.7-3.2 1.8-4.2"/>
        <circle cx="12" cy="12" r="2"/>
        <path d="M18 12c0 1.7-.7 3.2-1.8 4.2"/>
      </svg>
    </div>
    <h1>Welcome to RecordCrate</h1>
    <p class="subtitle">Sign in to start tracking your music journey</p>
    <div id="auth0-login-container"></div>
  </div>

  <script src="https://cdn.auth0.com/js/lock/11.x/lock.min.js"></script>
  <script>
    var config = JSON.parse(decodeURIComponent(escape(window.atob('@@config@@'))));
    
    var lock = new Auth0Lock(config.clientID, config.auth0Domain, {
      auth: {
        redirectUrl: config.callbackURL,
        responseType: config.callbackOnLocationHash ? 'token' : 'code',
        params: config.internalOptions
      },
      container: 'auth0-login-container',
      theme: {
        logo: 'https://recordcrate.netlify.app/auth0-logo.svg',
        primaryColor: '#c8955f'
      },
      languageDictionary: {
        title: ""
      },
      allowShowPassword: true,
      allowAutocomplete: true,
      allowPasswordAutocomplete: true,
      rememberLastLogin: true,
      autoclose: true
    });

    lock.show();
  </script>
</body>
</html>
```

## Step 4: Save and Test
1. Click **Save Changes**
2. Test the login flow from your app
3. The login page should now match RecordCrate's chocolate brown aesthetic

## Troubleshooting

**Logo not showing?**
- Make sure `public/auth0-logo.svg` is deployed to Netlify
- Check the URL is accessible: https://recordcrate.netlify.app/auth0-logo.svg

**Colors look different?**
- Clear browser cache
- Verify the hex codes in Auth0 Dashboard match exactly

**Mobile issues?**
- The template is responsive and should work on all devices
- Test on actual devices, not just browser DevTools

## Next Steps

After implementing this template, your Auth0 login page will:
- ✅ Match RecordCrate's warm, brown aesthetic
- ✅ Use the Disc3 icon logo
- ✅ Provide smooth animations and transitions
- ✅ Work seamlessly on mobile and desktop
- ✅ Feel like a natural part of your app, not a third-party service

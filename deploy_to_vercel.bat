@echo off
echo =======================================================
echo FABLOTA ZERO-DOWNTIME VERCEL DEPLOYMENT SYSTEM
echo =======================================================
echo.
echo Because Vercel has extreme security protocols, you must authorize your computer to upload to their cloud servers.
echo.
echo Step 1: Vercel will ask for your email address below.
echo Step 2: Go to your email inbox on this computer, and click the blue "Verify" button they send you.
echo Step 3: Come back to this black terminal window and press ENTER to deploy Fablota!
echo.
call npx vercel login

echo.
echo ------------------------------------------------------
echo Pushing authentications... Commencing Cloud Transfer!
echo ------------------------------------------------------
echo.

echo Deploying Manufacturer Production Bundle...
cd dist-manufacturer
call npx vercel --prod --name fablota-manufacturer --yes --force
cd ..

echo.
echo Deploying Retailer Production Bundle...
cd dist-retailer
call npx vercel --prod --name fablota-retailer --yes --force
cd ..

echo.
echo Deploying Super Admin Production Bundle...
cd dist-admin
call npx vercel --prod --name fablota-admin --yes --force
cd ..

echo.
echo =======================================================
echo DEPLOYMENT COMPLETE!
echo Look at the exact "Production:" URLs printed above to see your three brand new, permanent Vercel websites!
echo =======================================================
pause

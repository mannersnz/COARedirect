import os
import sys
import xml.etree.ElementTree as ET


def main():
    xml_text = os.environ.get("PUBLISH_PROFILE")
    if not xml_text:
        # Fallback to file if provided
        path = sys.argv[1] if len(sys.argv) > 1 else "publishProfile.xml"
        with open(path, "r", encoding="utf-8") as f:
            xml_text = f.read()

    root = ET.fromstring(xml_text)
    chosen = None
    for p in root.findall("publishProfile"):
        if p.get("publishMethod") == "ZipDeploy":
            chosen = p
            break
    if chosen is None:
        # fallback to MSDeploy, host is still `.scm.`
        for p in root.findall("publishProfile"):
            if p.get("publishMethod") == "MSDeploy":
                chosen = p
                break
    if chosen is None:
        raise SystemExit("No suitable publish profile found (ZipDeploy/MSDeploy)")

    publish_url = chosen.get("publishUrl", "")
    host = publish_url.split(":", 1)[0]
    user = chosen.get("userName", "")
    pwd = chosen.get("userPWD", "")

    # Try to find app/site name for fallback host
    app_name = None
    for p in root.findall("publishProfile"):
        if p.get("msdeploySite"):
            app_name = p.get("msdeploySite")
            break
    if not app_name:
        # derive from username like $appname
        if user.startswith("$"):
            app_name = user[1:]
    fallback_host = f"{app_name}.scm.azurewebsites.net" if app_name else host

    # Emit shell-safe assignments to eval in bash
    def shquote(s: str) -> str:
        return "'" + s.replace("'", "'\"'\"'") + "'"

    print(f"KUDU_HOST={shquote(host)}")
    print(f"KUDU_FALLBACK_HOST={shquote(fallback_host)}")
    print(f"KUDU_USER={shquote(user)}")
    print(f"KUDU_PASS={shquote(pwd)}")


if __name__ == "__main__":
    main()

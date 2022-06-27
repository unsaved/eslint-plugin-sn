#!/usr/bin/env bash

> both1.txt
while read LINE; do
    case "$LINE" in ''|'#'*|//*) continue; esac
    if grep -qFx "$LINE" clientWindowsMembers-noniso.txt; then
        echo $LINE >> both1.txt
    else
        echo $LINE
    fi
done < clientWindowsMembers-iso.txt > iso_only.txt

> both2.txt
while read LINE; do
    case "$LINE" in ''|'#'*|//*) continue; esac
    if grep -qFx "$LINE" clientWindowsMembers-iso.txt; then
        echo $LINE >> both2.txt
    else
        echo $LINE
    fi
done < clientWindowsMembers-noniso.txt > noniso_only.txt

#!/usr/bin/env bash
PROGNAME="${0##*/}"

set +u
shopt -s xpg_echo

SHORTNAME="${PROGNAME%%.*}"
case "$SHORTNAME" in
    minus)
        SYNTAX_MSG="$PROGNAME [-q] superFile.txt removeThese.txt"
        ;;
    union)
        SYNTAX_MSG="$PROGNAME [-q] file1.txt file2.txt"
        ;;
    *)
        echo "Script must be invoked with name like 'minus[.ext]' or 'union[.ext]'" 1>&2
        exit 99
esac

unset QUIET
[ $# -gt 1 -a "$1" = '-q' ] && {
    QUIET=true
    shift
}
[ $# -ne 2 ] && {
    echo "SYNTAX_MSG" 1>&2
    exit 2
}
F1="$1"; shift
F2="$1"; shift

Abort() {
    echo "Aborting $PROGNAME:  $*" 1>&2
    exit 1
}

[ -f "$F1" ] || Abort "No such file: $F1"
[ -f "$F2" ] || Abort "No such file: $F2"
[ -r "$F1" ] || Abort "Can't read file: $F1"
[ -r "$F2" ] || Abort "Can't read file: $F2"

RETVAL=1
while read ENTRY; do
    if grep -qlFx "$ENTRY" $F2; then
        [ "$SHORTNAME" = minus ] && continue
    else
        [ "$SHORTNAME" = union ] && continue
    fi
    RETVAL=0
    [ -n "$QUIET" ] && exit $RETVAL
    echo "$ENTRY"
done < "$F1"

exit $RETVAL

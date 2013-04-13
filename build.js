#!/usr/bin/env node
// Copyright (C) 2013 Claude Nobs, GPL 3.0

'use strict'

var fs   = require('fs')
var yaml = require('js-yaml')

var i = 0
function line(s) { return Array(i+1).join('  ') + s + '\n' }
function key(k) { return line('<key>' + k + '</key>') }
function str(v) { return line('<string>' + v.trim() + '</string>') }
function val(v) { return line(typeof v === 'boolean' ? (v ? '<true/>' : '<false/>') : '<string><![CDATA[' + v.trim() + ']]></string>') }
function arr(v, f) { var d='',j=0,jL=v.length; i++; for(;j<jL;j++) d += (f || val)(v[j]); i--; return line('<array>') + d + line('</array>') }
function obj(o) {
	var k, v, d = ''
	i++
	for(k in o)
	{
		v = o[k]
		d += key(k)
		if(k === 'BBEditDocumentType') d += str(v) + key('com.barebones.DocumentType') + str(v)
		else if(k === 'BBLMSuffixMap') d += arr(v, function(e){ return obj({'BBLMLanguageSuffix': e}) })
		else d += v instanceof Array ? arr(v) : typeof v === 'object' ? obj(v) : val(v)
	}
	i--
	return line('<dict>') + d + line('</dict>')
}
function doc(yml) {
	return '<?xml version="1.0" encoding="UTF-8"?>\n'
	     + '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n'
	     + '<plist version="1.0">\n'
	     + obj(yml)
	     + '</plist>\n'
}

var path  = __dirname + '/'
var bPath = path + 'build/'
var regex = /\.ya?ml$/
var files = fs.readdirSync(path).filter(function(e){ return regex.test(e) })

try{ fs.mkdirSync(bPath) } catch(e) { if(e.errno !== 47) throw e }

files.forEach(function(e){ fs.writeFileSync(bPath + e.replace(regex, '.plist'), doc(require(path + e))) });